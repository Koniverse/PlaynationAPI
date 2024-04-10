import EventType, {EventTypeEnum} from '@src/models/EventType';
import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import Event from '../models/Event';
import {AccountService} from '@src/services/AccountService';
import {v4} from 'uuid';
import Game from '@src/models/Game';

export interface SubmitEventParams {
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
      slug: 'booka',
      name: 'Booka Game',
      url: 'https://booka.com',
      description: 'Default event type',
      maxEnergy: 0,
      maxPoint: 100000,
      icon: 'https://via.placeholder.com/150',
      banner: 'https://via.placeholder.com/1200x600',
      active: true,
    });
  }

  async getEventTypes() {
    return await Game.findAll();
  }

  async getEventTypeBySlug(slug: string) {
    return await EventType.findOne({ where: { slug } });
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