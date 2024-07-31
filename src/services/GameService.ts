import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import {
  Account,
  Game,
  GameData,
  GameInventoryItem,
  GameInventoryItemStatus,
  GamePlay,
  LeaderboardPerson,
} from '@src/models';
import { v4 } from 'uuid';
import { AccountService } from '@src/services/AccountService';
import { QueryTypes } from 'sequelize';
import { QuickGetService } from './QuickGetService';

export interface newGamePlayParams {
  gameId: number;
}

export interface SubmitGamePlayParams {
  gamePlayId: number;
  signature: string;
  point: number;
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

export interface GamePlayCheckParams {
  telegramId: number;
  point?: number;
  playCount?: number;
  startTime?: string;
  endTime?: string;
}

export interface MultiGamePlayCheckParams extends GamePlayCheckParams{
  gameSlugs?: string[];
}

interface PlaySummaryItem {
  game_slug: string;
  game_id: number;
  play_count?: number;
  total_point?: number;
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
    });
  }

  async syncData(data: GameContentCms[]) {
    const response = {
      success: true,
    };

    for (const item of data) {
      const itemData = { ...item } as unknown as Game;
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

  async submitGameplay(params: SubmitGamePlayParams) {
    const gamePlay = await GamePlay.findByPk(params.gamePlayId);

    if (!gamePlay) {
      throw new Error('Game play not found');
    }

    const game = await this.findGame(gamePlay?.gameId || 0);
    if (!game) {
      throw new Error('Game not found');
    }
    this.checkGameActive(game);

    // Validate max point
    if (params.point > game.maxPointPerGame) {
      throw new Error('Point limit exceeded');
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

    await gamePlay.update({
      point: pointRate,
      gamePoint: point,
      ratio: game.pointConversionRate,
      endTime: new Date(),
      success: true,
    });

    await this.addGameDataPoint(gamePlay.accountId, gamePlay.gameId, point, pointRate);

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

  public async checkGamePlayByTelegramId({telegramId, gameSlugs, point, playCount, startTime, endTime}: MultiGamePlayCheckParams) {
    if (!telegramId) {
      throw new Error('Invalid telegramId');
    }
    const checkPoint = point || 0;
    const checkPlayCount = playCount || 0;
    const account = await Account.findOne({
      where: {
        telegramId,
        isEnabled: true,
      },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const sTime = startTime ? new Date(startTime) : undefined;
    const eTime = endTime ? new Date(endTime) : undefined;
    const playSummary = await this.getGamePlaySummary(account.id, gameSlugs, sTime, eTime);
    const pointMap: Record<string, boolean> = {};
    const playMap: Record<string, boolean> = {};

    playSummary.forEach((p) => {
      pointMap[p.game_slug] = !!p.total_point && p.total_point >= checkPoint;
      playMap[p.game_slug] = !!p.total_point && p.total_point >= checkPlayCount;
    });

    return {
      telegramId,
      pointCheck: pointMap,
      playCheck: playMap,
    };
  }

  public async getGamePlaySummary(accountId: number, gameSlugs?: string[], startTime?: Date, endTime?: Date) {
    const gameQuery = gameSlugs ? 'and g."slug" in (:gameSlugs)' : '';
    const startTimeQuery = startTime ? 'and gp."endTime" >= :startTime' : '';
    const endTimeQuery = endTime ? 'and gp."endTime" <= :endTime' : '';

    const sql = `
    WITH play_rs AS (
      SELECT gp."gameId" game_id, count(gp.id) play_count, sum(gp.point) total_point
      FROM game_play gp
          JOIN game g ON gp."gameId" = g.id
          JOIN account a ON gp."accountId" = a.id
      WHERE a.id = :accountId and gp.success = true ${gameQuery} ${startTimeQuery} ${endTimeQuery} 
      GROUP BY 1
    )
    SELECT g.slug game_slug, play_rs.* from game g
        LEFT JOIN play_rs ON g.id = play_rs.game_id
        WHERE 1=1 ${gameQuery}`;

    return await this.sequelizeService.sequelize.query<PlaySummaryItem>(sql, {
      replacements: {accountId, gameSlugs, startTime, endTime},
      type: QueryTypes.SELECT,
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
