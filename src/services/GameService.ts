import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import Game from '@src/models/Game';
import {CacheService} from '@src/services/CacheService';
import {Account, GameData, GamePlay} from '@src/models';
import { v4 } from 'uuid';

export interface SubmitGamePlayParams {
  eventId: number;
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
      maxPoint: 100000,
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
    const game = await Game.findByPk(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const account = await Account.findByPk(accountId);
    if (!account) {
      throw new Error('Account not found');
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

  // Todo: newGame
  async newGamePlay(accountId: number, gameId: number) {
    const gameData = await this.getGameData(accountId, gameId);
    const game = await Game.findByPk(gameId);

    return GamePlay.create({
      accountId: gameData.accountId,
      gameId: gameData.gameId,
      gameDataId: gameData.id,
      startTime: new Date(),
      energy: game?.energyPerGame || 0,
      token: v4(),
    });
  }

  // Todo: submitGameplay
  async submitGameplay(params: SubmitGamePlayParams) {
    return {};
  }

  // Todo: getHistories
  async getGameplayHistory(accountId: number) {
    return {};
  }

  // Todo: getLeaderBoard
  async getLeaderBoard(gameId: number) {
    return {};
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