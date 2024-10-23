import { createPromise } from '@src/utils';
import { CardInfo, CardInfo__Output } from '@koniverse/telegram-bot-grpc';
import { GRPCService } from '@src/services/GRPCService';
import { EventInfo } from '@src/services/MythicalEventService';
import { preGameMiddleware } from '@src/services/mythicalGamePlay/MythicalPreGamePlay';
import { playGameMiddleware } from '@src/services/mythicalGamePlay/MythicalGamePlay';
import * as console from 'node:console';

export interface BonusPoint {
  point: number,
  conditions: Record<string, string>
}

export enum CardStat {
  STR = 'strength',
  ACC = 'acceleration',
  JMP = 'jump',
  POW = 'power',
  PRE = 'presence',
  END = 'endurance',
  QUI = 'quickness',
  CAR = 'carry'
}

export type ProcessState = 'finished' | 'active' | 'idle' | 'ready';

export interface RoundInfo {
  id: number,
  stats: CardStat[],
  remainingStats: CardStat[],
  state: ProcessState,
  difficulty: number,
  idealStat: Record<string, number>,
  timeEnd?: string,
  cardOpponent?: CardInfo,
  cardPlayerCanBeat?: CardInfo,
  isWin?: boolean,
  score: number,
  cardPlayer?: CardInfo,
}

export interface RoundInfo_Output extends Omit<RoundInfo, 'stats' | 'remainingStats'> {
  stats: CardStat[][],
}

export interface GameInfo {
  id: string,
  playerId: string,
  seedEvent: string,
  cardOpponents: CardInfo[],
  rounds: RoundInfo[],
  currentRound: number,
  creatAt: string,
  state: ProcessState,
  isWin?: boolean,
  bonusPoints?: BonusPoint[],
  cardPlayerSelected: CardInfo[]
}

const grpcService = GRPCService.instance;
export class MythicalCardGameService {
  cardMapReady = createPromise<void>();
  private cardMap: Record<string, CardInfo__Output> = {};
  private static _instance: MythicalCardGameService;

  private constructor() {
    grpcService.getAllNflRivalCard().then(
      (response) => {
        this.cardMap = response.cards;
        this.cardMapReady.resolve();
      },
    ).catch((error) => {console.error('Error', error);});
  }

  async getCardMap() {
    await this.cardMapReady.promise;
    return this.cardMap;
  }

  public getGameById(idGame: string): GameInfo {
    return {} as GameInfo;
  }

  async getUserCard(telegramId: number) {
    await this.cardMapReady.promise;

    return await grpcService.getCardByTelegramId(telegramId);
  }

  public createGameId( idGame: string, cardSelected: string[]) {
    return idGame + cardSelected.join('');

  }

  public async readyStartGame (event: EventInfo, cardsSelected: CardInfo[], idPlayer: string): Promise<GameInfo> {

    return await preGameMiddleware(cardsSelected, idPlayer, event);

  }

  public async playGame(game: GameInfo, cardToSelected: string): Promise<RoundInfo> {
    const { id: idGame } = game;

    if (!game) {
      throw new Error('Game not found');
    }


    return await playGameMiddleware(game, cardToSelected);

  }

  public selectCardToPlayEachRound(game: GameInfo, defId: string): CardInfo {
    const cardPlayerSelected = this.cardMap[defId];

    if(!cardPlayerSelected) {
      throw new Error('Card not found');
    }

    return cardPlayerSelected;
  }
  public static get instance() {
    if (!this._instance) {
      this._instance = new MythicalCardGameService();
    }

    return this._instance;
  }
}

export const mythicalCardGameService = MythicalCardGameService.instance;