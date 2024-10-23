import {
  BonusPoint,
  CardStat,
  GameInfo,
  MythicalCardGameService,
  RoundInfo,
} from '@src/services/MythicalCardGameService';
import { CardInfo, CardInfo__Output } from '@koniverse/telegram-bot-grpc';
import * as console from 'node:console';

export interface EventInfo {
  seedGame: string,
  round: number,
  baseDifficulty: number,
  dateEnd?: string,
  dateStart?: string,
  stats: CardStat[],
  bonusPoints?: BonusPoint[],
  gameStored: string[],
  opponentTeam?: string
}

type EventRecord = Record<string, EventInfo>

export class MythicalEventService {
  private gameService: MythicalCardGameService;
  private _eventRecord: EventRecord = {};

  private constructor() {
    this.gameService = MythicalCardGameService.instance;
  }

  public createNewEvent(event: EventInfo) {
    this._eventRecord[event.seedGame] = event;
  }

  get eventRecord(): EventRecord {
    return this._eventRecord;
  }

  public async startEvent(seedEvent: string, cardsSelected: CardInfo[], idPlayer: string): Promise<GameInfo> {
    console.log('LOG: Event record', this._eventRecord);
    const event = this._eventRecord[seedEvent];

    const cardsPlayGame = this.selectedCardsPlayerValidate(event, cardsSelected);
    return await this.createGameOfEvent(event, cardsPlayGame, idPlayer);
  }

  public async playGameEachRound(seedEvent: string, idGame: string, cardToSelected: string): Promise<RoundInfo> {
    const event = this._eventRecord[seedEvent];
    if (!event) {
      throw new Error('Event not found');
    }

    if (!event.gameStored.includes(idGame)) {
      throw new Error('Game not found');
    }

    const game = this.gameService.getGameById(idGame);

    if (game.state === 'finished') {
      throw new Error('Game is finished');
    }

    if (game.state === 'active') {
      throw new Error('Game is active');
    }

    if (game.currentRound === event.round) {
      throw new Error('Game is in the last round');
    }

    return await this.gameService.playGame(game, cardToSelected);
  }

  private selectedCardsPlayerValidate(event: EventInfo, cardsSelected: CardInfo[]): CardInfo[] {
    const roundNumber = event.round;

    console.log('LOG: Cards selected', cardsSelected, 'Round Number', roundNumber);

    if (cardsSelected.length !== roundNumber + 1) {
      throw new Error('You cannot select more cards');
    }

    return cardsSelected;
  }

  private async createGameOfEvent(event: EventInfo, cardsSelected: CardInfo[], idPlayer: string): Promise<GameInfo> {
    const game = await this.gameService.readyStartGame(event, cardsSelected, idPlayer);

    event.gameStored.push(game.id);
    this.eventRecord[event.seedGame] = event;

    return game;
  }

  // Singleton this class
  private static _instance: MythicalEventService;
  public static get instance() {
    if (!this._instance) {
      this._instance = new MythicalEventService();
    }

    return this._instance;
  }
}