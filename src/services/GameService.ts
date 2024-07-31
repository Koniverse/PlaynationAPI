import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import {
  Account,
  Game,
  GameData,
  GameInventoryItem,
  GameInventoryItemStatus,
  GamePlay, GameType,
} from '@src/models';
import { v4 } from 'uuid';
import { AccountService } from '@src/services/AccountService';
import { QuickGetService } from '@src/services/QuickGetService';
import { GameState } from '@playnation/game-sdk/dist/types';
import {tryToParseJSON, tryToStringify, validatePayload} from '@src/utils';
import EnvVars from '@src/constants/EnvVars';
import {Op} from 'sequelize';

export interface newGamePlayParams {
  gameId: number;
}

export interface SubmitGamePlayParams {
  gamePlayId: number;
  signature: string;
  point: number;
}

export interface GetLastStateParams {
  gameId: number;
}

export interface SubmitGamePlayStateParams {
  gamePlayId: number;
  stateData: GameState<any>;
}

interface LeaderboardRecord {
  rank: string; // SQL query returns rank as string
  accountId: number;
  address: string;
  firstName: string;
  lastName: string;
  point: string; // SQL query returns point as string
  telegramUsername: string;
  avatar: string;
  mine: boolean;
}

const accountService = AccountService.instance;
const quickGetService = QuickGetService.instance;

export interface GameContentCms {
  id: number;
  name: string;
  description: string;
  url: string;
  maxEnergy: number;
  slug: string;
  active: boolean;
  maxPoint: number;
  energyPerGame: number;
  pointConversionRate: number;
  maxPointPerGame: number;
  icon: string;
  rank_definition: string;
  banner: string;
  startTime: Date;
  endTime: Date;
}

export interface GameInventoryItemParams {
  gameInventoryItemId: number;
}

export class GameService {
  private gameMap: Record<string, Game> | undefined;

  constructor(private sequelizeService: SequelizeService) {}

  async generateDefaultData() {
    const existed = await Game.findOne({ where: { slug: 'booka' } });
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
      maxPointPerGame: 100000000,
      icon: 'https://via.placeholder.com/150',
      banner: 'https://via.placeholder.com/1200x600',
      rankDefinition: '{}',
      active: true,
      gameType: GameType.CASUAL,
    });
  }

  async syncData(data: GameContentCms[]) {
    const response = {
      success: true,
    };

    for (const item of data) {
      const itemData = { ...item } as unknown as Game;
      itemData.gameType = itemData.gameType || GameType.CASUAL;
      const existed = await Game.findOne({ where: { contentId: item.id } });
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

  async getGameDataByAccount(accountId: number) {
    return GameData.findAll({
      where: {
        accountId,
      },
    });
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

  checkGameActive(game: Game) {
    const now = new Date();
    const checkActive = game.active && (!game.endTime || now <= game.endTime);
    if (!checkActive) {
      throw new Error('Game is not active');
    }
  }

  async newGamePlay(accountId: number, gameId: number) {
    const account = await accountService.findById(accountId);
    if (!account || account.isEnabled === false) {
      throw new Error('Your account is suspended');
    }
    const gameData = await this.getGameData(accountId, gameId);
    const game = await this.findGame(gameId);
    this.checkGameActive(game);
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

  async addGameDataPoint(accountId: number, gameId: number, point: number, pointRate: number) {
    const account = await accountService.findById(accountId);
    if (!account || account.isEnabled === false) {
      throw new Error('Your account is suspended');
    }
    const gameData = await this.getGameData(accountId, gameId);
    await gameData.update({
      point: gameData.point + point,
    });
    await accountService.addAccountPoint(accountId, pointRate);
  }

  async submitGamePlayState(gamePlayId: number, stateData: GameState<unknown>) {
    const gamePlay = await quickGetService.requireGamePlay(gamePlayId);
    const game = await quickGetService.findGame(gamePlay.gameId);
    this.checkGameActive(game);

    // Validate data
    if (!stateData.data || !stateData.signature) {
      throw new Error('Invalid state data');
    }

    const {data, signature, timestamp} = stateData;

    const isSignatureValid = await validatePayload(stateData.data, stateData.signature, EnvVars.Game.FarmingGameToken);
    // if (!isSignatureValid) {
    //   throw new Error('Invalid signature');
    // }

    const newStateCount = (gamePlay.stateCount || 0) + 1;

    await gamePlay.update({
      state: tryToStringify(data),
      stateData: tryToParseJSON<unknown>(data),
      stateSignature: signature,
      stateTimestamp: timestamp,
      stateCount: newStateCount,
      endTime: new Date(),
      point: 0,
      success: isSignatureValid,
    });

    return {
      success: isSignatureValid,
    };
  }

  async getLastState(accountId: number, gameId: number) {
    const game = await quickGetService.requireGame(gameId);
    if (game.gameType !== GameType.FARMING) {
      throw new Error('Invalid method');
    }
    const lastGamePlay = await GamePlay.findOne({
      where: {
        accountId: accountId,
        gameId: game.id,
        state: {[Op.not]: null},
      },
      order: [['id', 'DESC']],
    });

    if (lastGamePlay?.state && typeof lastGamePlay?.state !== 'string') {
      // @ts-ignore
      lastGamePlay.state = JSON.stringify(lastGamePlay.state);
    }

    return lastGamePlay;
  }

  async submitGameplay(params: SubmitGamePlayParams) {
    const gamePlay = await quickGetService.requireGamePlay(params.gamePlayId);
    const game = await quickGetService.findGame(gamePlay.gameId);

    this.checkGameActive(game);

    if (game.gameType !== GameType.CASUAL) {
      throw new Error('Invalid method');
    }

    // Validate point <0
    if (params.point < 0) {
      throw new Error('Invalid point');
    }

    // Validate submitted
    if (gamePlay.endTime) {
      throw new Error('Game already submitted');
    }

    // Todo: Validate signature

    // Validate by time
    // Each game must be at least 25s
    // May be cheating
    // const timeDiff = new Date().getTime() - gamePlay.startTime.getTime();
    // if (timeDiff < 25000) {
    //   await gamePlay.update({
    //     point: -1,
    //     endTime: new Date(),
    //     success: false,
    //   });
    //
    //   throw new Error('Invalid game');
    // }

    // Timeout if game is submitting too long
    const point = params.point;
    const pointRate = Math.floor(params.point * game.pointConversionRate);
    let success = true;
    // Validate max point
    if (params.point > game.maxPointPerGame) {
      success = false;
    }

    await gamePlay.update({
      point: pointRate,
      gamePoint: point,
      ratio: game.pointConversionRate,
      endTime: new Date(),
      success,
    });

    if (success) {
      await this.addGameDataPoint(gamePlay.accountId, gamePlay.gameId, point, pointRate);
    }

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

  async useGameInventoryItem(accountId: number, gameInventoryItemId: number) {
    const account = await accountService.findById(accountId);
    if (!account) {
      throw new Error('Account not found');
    }
    const gameInventoryItem = await GameInventoryItem.findByPk(gameInventoryItemId);
    if (!gameInventoryItem) {
      throw new Error('Game inventory item not found');
    }
    if (gameInventoryItem.accountId !== accountId) {
      throw new Error('Invalid account');
    }
    if (gameInventoryItem.status !== GameInventoryItemStatus.ACTIVE) {
      throw new Error('Inventory item not used');
    }
    await gameInventoryItem.update({
      status: GameInventoryItemStatus.USED,
      usedTime: new Date(),
    });
    return {
      success: true,
    };
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
