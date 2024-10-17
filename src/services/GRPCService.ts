import Protocols, {
  GetAllCardResponse__Output, GetCardByTelegramResponse__Output,
  NflRivalCardClient,
  TelegramAuthClient,
  TelegramAuthResponse__Output,
} from '@koniverse/telegram-bot-grpc';
import {credentials} from '@grpc/grpc-js';


const SERVER_URL = process.env.GRPC_SERVER_URL || 'localhost:9090';

export class GRPCService {
  public readonly telegramAuth: TelegramAuthClient;
  public readonly cardManagement: NflRivalCardClient;
  constructor() {
    this.telegramAuth = new Protocols.telegram.auth.TelegramAuth(
      SERVER_URL,
      credentials.createInsecure(),
    );

    this.cardManagement = new Protocols.mythical.nfl_rival_card.NflRivalCard(
      SERVER_URL,
      credentials.createInsecure(),
      {
        'grpc.max_receive_message_length': 33554432, // 32MB
      },
    );

    console.log('GRPCService initialized with server url:', SERVER_URL);
  }

  async validateTelegramInitData(initData: string, botUsername?: string) {
    return new Promise<TelegramAuthResponse__Output>((resolve, reject) => {
      this.telegramAuth.validate(
        {
          botUsername,
          initData,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (!result) {
            reject(new Error('No result'));
          } else {
            resolve(result);
          }
        },
      );
    });
  }

  async getAllNflRivalCard() {
    return new Promise<GetAllCardResponse__Output>((resolve, reject) => {
      this.cardManagement.getAllCard(
        {},
        (error, result) => {
          if (error) {
            reject(error);
          } else if (!result) {
            reject(new Error('No result'));
          } else {
            resolve(result);
          }
        },
      );
    });
  }

  async getCardByTelegramId(telegramId: number) {
    return new Promise<GetCardByTelegramResponse__Output>((resolve, reject) => {
      this.cardManagement.getCardByTelegramId(
        {
          telegramId,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (!result) {
            reject(new Error('No result'));
          } else {
            resolve(result);
          }
        },
      );
    });
  }

  // Singleton this class
  private static _instance: GRPCService;
  public static get instance() {
    if (!this._instance) {
      this._instance = new GRPCService();
    }

    return this._instance;
  }
}
