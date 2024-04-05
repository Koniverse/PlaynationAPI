import EventType, {EventTypeEnum} from '@src/models/EventType';
import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import Event from '../models/Event';
import {AccountService} from '@src/services/AccountService';
import {v4} from 'uuid';

export interface SubmitEventParams {
  eventId: number;
  signature: string;
  point: number;
}

export class EventService {
  constructor(private sequelizeService: SequelizeService) {

  }

  async generateDefaultEventType() {
    const existed = await EventType.findOne({ where: { slug: 'play_booka' } });
    if (existed) {
      return existed;
    }

    return await EventType.create({
      slug: 'play_booka',
      name: 'Play Booka Game',
      description: 'Default event type',
      type: EventTypeEnum.GAMEPLAY,
      requireValidate: false,
      canRepeat: true,
      repeatInterval: 0,
      energy: 0,
      maxPoint: 1000,
      minPoint: 0,
      icon: 'https://via.placeholder.com/150',
      banner: 'https://via.placeholder.com/1200x600',
      startTime: new Date('2024-01-01T00:00:00Z'),
      stopTime: new Date('2029-01-01T00:00:00Z'),
    });
  }

  async getEventTypes() {
    return await EventType.findAll();
  }

  async getEventTypeBySlug(slug: string) {
    return await EventType.findOne({ where: { slug } });
  }

  async joinEvent(address: string, eventTypeSlug: string) {
    const account = await AccountService.instance.findByAddress(address);

    if (!account) {
      throw new Error('Account not found');
    }

    const eventType = await this.getEventTypeBySlug(eventTypeSlug);
    if (!eventType) {
      throw new Error('Event type not found');
    }

    const accountAttribute = await account.getAccountAttribute();
    if (accountAttribute.energy < eventType.energy) {
      throw new Error('Not enough energy');
    }

    // Deduct energy
    accountAttribute.energy -= eventType.energy;
    await accountAttribute.save();

    // Create event
    const event = await Event.create({
      eventTypeId: eventType.id,
      accountId: account.id,
      startTime: new Date(),
      energy: eventType.energy,
      token: v4(), // Random token
    });

    return event;
  }

  async submitEvent({eventId, signature, point}: SubmitEventParams) {
    // Validate data
    const event = await Event.findByPk(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const eventType = await event.getEventType();
    if (eventType.minPoint && point < eventType.minPoint || eventType.maxPoint && point > eventType.maxPoint) {
      throw new Error('Invalid point');
    }

    try {
      //Todo: Validate signature

      // Submit data
      if (eventType.point) {
        point = eventType.point;
      }
      const account = await event.getAccount();
      const accountAttribute = await account.getAccountAttribute();

      accountAttribute.point += point;
      await accountAttribute.save();

      event.endTime = new Date();
      event.success = true;
      await event.save();
    } catch (e) {
      event.endTime = new Date();
      event.success = false;
      await event.save();

      console.error(e);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      event.error = e.message;
    }

    return event;
  }

  // Singleton
  private static _instance: EventService;
  public static get instance() {
    if (!EventService._instance) {
      EventService._instance = new EventService(SequelizeServiceImpl);
    }
    return EventService._instance;
  }
}