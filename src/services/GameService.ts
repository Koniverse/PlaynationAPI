import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import {Account, AccountAttribute, GameData, GamePlay, Game} from '@src/models';
import { v4 } from 'uuid';
import {AccountService} from '@src/services/AccountService';
import * as console from "console";

export interface newGamePlayParams {
  gameId: number;
}

export interface SubmitGamePlayParams {
  gamePlayId: number;
  signature: string;
  point: number;
}

const accountService = AccountService.instance;


export interface GameContentCms {
    id: number,
    name: string,
    description: string,
    url: string,
    maxEnergy: number,
    slug: string,
    active: boolean,
    maxPoint: number,
    energyPerGame: number,
    maxPointPerGame: number,
    icon: string,
    rank_definition: string,
    banner: string

}

export class GameService {
  private gameMap: Record<string, Game> | undefined;

  constructor(private sequelizeService: SequelizeService) {
    
  }

  async generateDefaultData() {
    const existed = await Game.findOne({ where: { slug: 'play_booka' } });
    if (existed) {
      return existed;
    }

    return await Game.create({
      contentId: 1,
      slug: 'booka',
      name: 'Booka Game',
      url: 'https://booka.com',
      description: 'Default event type',
      maxEnergy: 1440,
      energyPerGame: 90,
      maxPointPerGame: 100000,
      icon: 'https://via.placeholder.com/150',
      banner: 'https://via.placeholder.com/1200x600',
      rankDefinition: '{}',
      active: true,
    });
  }

  async syncData(data: GameContentCms[]) {
    const response = {
      success: true,
    };

    for (const item of data) {
      const itemData = {...item} as unknown as Game;
      const existed = await Game.findOne({where: {contentId: item.id}});
      itemData.rankDefinition = JSON.stringify(item.rank_definition);
      if (existed) {
        await existed.update(itemData);
      } else {
        itemData.contentId = item.id;
        await Game.create(itemData);
      }
    }
    await this.buildGameMap();
    return response;
  }

  async buildGameMap() {
    const data = await Game.findAll();
    const gameMap: Record<string, Game> = {};
    data.forEach((game) => {
      gameMap[game.id.toString()] = game;
    });

    this.gameMap = gameMap;
    return gameMap;
  }

  async listGame() {
    const gameMap = !!this.gameMap ? this.gameMap : await this.buildGameMap();

    return Object.values(gameMap);
  }

  async findGame(gameId: number) {
    const gameMap = !!this.gameMap ? this.gameMap : await this.buildGameMap();

    return gameMap[gameId.toString()];
  }
  
  async getGameData(accountId: number, gameId: number) {
    const account = await Account.findByPk(accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    const game = await this.findGame(gameId);

    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }

    const existed = await GameData.findOne({
      where: {
        accountId,
        gameId,
      },
    });

    if (existed) {
      return existed;
    } else {
      return GameData.create({
        gameId,
        accountId,
        level: 1,
        point: 0,
        rank: 0,
        dayLimit: 0,
      });
    }
  }

  async newGamePlay(accountId: number, gameId: number) {
    const gameData = await this.getGameData(accountId, gameId);
    const game = await this.findGame(gameId);
    const usedEnergy = game?.energyPerGame || 0;

    await accountService.useAccountEnergy(accountId, usedEnergy);

    return GamePlay.create({
      accountId: gameData.accountId,
      gameId: gameData.gameId,
      gameDataId: gameData.id,
      startTime: new Date(),
      energy: game?.energyPerGame || 0,
      token: v4(),
    });
  }

  async submitGameplay(params: SubmitGamePlayParams) {
    const gamePlay = await GamePlay.findByPk(params.gamePlayId);

    if (!gamePlay) {
      throw new Error('Game play not found');
    }

    // Validate max point
    const game = await this.findGame(gamePlay?.gameId || 0);
    if (!game) {
      throw new Error('Game not found');
    }

    // Todo: Validate signature
    if (params.point > game.maxPointPerGame) {
      throw new Error('Point limit exceeded');
    }

    // Todo: Validate by time

    await gamePlay.update({
      point: params.point,
      endTime: new Date(),
      success: true,
    });

    await accountService.addAccountPoint(gamePlay.accountId, params.point);

    return gamePlay;
  }

  async getGameplayHistory(accountId: number, gameId?: number) {
    return GamePlay.findAll({
      where: {
        accountId,
        gameId,
      },
    });
  }

  async getLeaderBoard(accountId: number, gameId?: number) {
    // Todo: Fill more information and optimize with raw query
    return AccountAttribute.findAll({
      order: [['point', 'DESC']],
      limit: 100,
    });
  }

  // Singleton
  private static _instance: GameService;
  public static get instance() {
    if (!GameService._instance) {
      GameService._instance = new GameService(SequelizeServiceImpl);
    }
    return GameService._instance;
  }
}
