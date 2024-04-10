import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import {CacheService} from '@src/services/CacheService';
import {Account, AccountAttribute, GameData, GamePlay, Game} from '@src/models';
import { v4 } from 'uuid';

export interface newGamePlayParams {
  gameId: number;
}

export interface SubmitGamePlayParams {
  gamePlayId: number;
  signature: string;
  point: number;
}

export class GameService {
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
      maxEnergy: 0,
      energyPerGame: 0,
      maxPointPerGame: 100000,
      icon: 'https://via.placeholder.com/150',
      banner: 'https://via.placeholder.com/1200x600',
      rankDefinition: '{}',
      active: true,
    });
  }

  async syncGameList() {
    await CacheService.instance.isReady;
    const client = CacheService.instance.redisClient;
    await client.del('game_list');
  }

  async listGame() {
    await CacheService.instance.isReady;
    const client = CacheService.instance.redisClient;
    const gameListCache = await client.get('game_list');
    if (gameListCache) {
      return JSON.parse(gameListCache) as Game[];
    }

    const data = await Game.findAll();

    client.set('game_list', JSON.stringify(data));

    return data;
  }
  
  async getGameData(accountId: number, gameId: number) {
    const account = await Account.findByPk(accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    const game = await Game.findByPk(gameId);

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
    }
    
    return GameData.create({
      gameId,
      accountId,
      level: 1,
      point: 0,
      rank: 0,
      dayLimit: 0,
    });
  }

  async newGamePlay(accountId: number, gameId: number) {
    const gameData = await this.getGameData(accountId, 1);
    const game = await Game.findByPk(1);

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
    const game = await Game.findByPk(gamePlay?.gameId || 0);
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