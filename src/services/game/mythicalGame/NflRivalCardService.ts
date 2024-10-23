import {GRPCService} from '@src/services/GRPCService';
import {CardInfo__Output} from '@koniverse/telegram-bot-grpc';
import {createPromise} from '@src/utils';

const grpcService = GRPCService.instance;
export class NflRivalCardService {
  cardMapReady = createPromise<void>();
  private cardMap: Record<string, CardInfo__Output> = {};
  
  constructor() {
    grpcService.getAllNflRivalCard().then(
      (response) => {
        this.cardMap = response.cards;
        this.cardMapReady.resolve();
      },
    ).catch(console.error);
  }

  async getCardMap() {
    await this.cardMapReady.promise;
    return this.cardMap;
  }

  async getUserCard(accountId: number) {
    //Todo: Issue-22 | AnhMTV | Get Telegram ID from user

    return await grpcService.getCardByTelegramId(0);
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
