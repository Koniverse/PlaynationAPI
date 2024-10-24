import {GRPCService} from '@src/services/GRPCService';
import {CardInfo__Output} from '@koniverse/telegram-bot-grpc';
import {createPromise} from '@src/utils';
import {QuickGetService} from '@src/services/QuickGetService';
import logger from 'jet-logger';

const grpcService = GRPCService.instance;
const quickGetService = QuickGetService.instance;

export class NflRivalCardService {
  cardMapReady = createPromise<void>();
  private cardMap: Record<string, CardInfo__Output> = {};
  
  constructor() {
    grpcService.getAllNflRivalCard().then(
      (response) => {
        this.cardMap = response.cards;
        this.cardMapReady.resolve();
      },
    ).catch(logger.err);
  }

  async getCardMap() {
    await this.cardMapReady.promise;
    return this.cardMap;
  }

  async getUserCard(accountId: number) {
    //Issue-22 | AnhMTV | Get Telegram ID from user
    const account = await quickGetService.requireAccount(accountId);

    return await grpcService.getCardByTelegramId(account.telegramId);
  }

  async getUserCardByTelegram(telegramId: number) {
    await this.cardMapReady.promise;

    return await grpcService.getCardByTelegramId(telegramId);
  }
  
  // Singleton this class
  private static _instance: NflRivalCardService;
  public static get instance() {
    if (!this._instance) {
      this._instance = new NflRivalCardService();
    }

    return this._instance;
  }
}
