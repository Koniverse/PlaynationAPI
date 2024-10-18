import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import {Game, GameType,} from '@src/models';
import {AccountService} from '@src/services/AccountService';
import {QuickGetService} from '@src/services/QuickGetService';
import {GameState} from '@playnation/game-sdk';


export interface GamePlayCheckParams {
  telegramId: number;
  point?: number;
  playCount?: number;
  startTime?: string;
  endTime?: string;
}


interface PlaySummaryItem {
  game_slug: string;
  game_id: number;
  play_count?: number;
  total_point?: number;
}

const accountService = AccountService.instance;
const quickGetService = QuickGetService.instance;

export interface GameEventContentCMS {
  id: number;
  documentId: string;
  name: string;
  icon: string;
  description: string;
  start_time: Date;
  end_time: Date;
  toss_up_info: object;
  toss_up_bonus: object;
}

export class GameEventService {
  private gameMap: Record<string, Game> | undefined;

  constructor(private sequelizeService: SequelizeService) {}

  async sync(data: GameEventContentCMS[]) {
    const response = {
      success: true,
    };

    for (const item of data) {
      const game = await quickGetService.findGame(item.id);
    }

    await quickGetService.buildGameMap();
    return response;
  }

  async list() {
    return await quickGetService.listGame();
  }

  async find(id: number) {
    return await quickGetService.findGame(id);
  }

  // Singleton
  private static _instance: GameEventService;
  public static get instance() {
    if (!GameEventService._instance) {
      GameEventService._instance = new GameEventService(SequelizeServiceImpl);
    }
    return GameEventService._instance;
  }
}
