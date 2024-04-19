import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import EnvVars from '@src/constants/EnvVars';
import fetch from 'node-fetch';
import {Account} from '@src/models';

export interface TelegramMessageItem {
  id: string,
  telegramId: number;
  data: any;
}

export class TelegramService {
  private telegramMessageQueue: Record<string, TelegramMessageItem> = {};
  private isRunning = false;
  constructor(private sequelizeService: SequelizeService) {}

  getUrlApi(action: string){
    return `https://api.telegram.org/bot${EnvVars.Telegram.Token}/${action}`;
  }

  async addTelegramMessage( data: any){
    const accountDataList = await Account.findAll({})
    // add to queue in memory
    accountDataList.forEach((account) => {
      const telegramId = account.telegramId;
      const messageId = `${telegramId}-${new Date().getTime()}`;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const dataSend = {...data, chat_id: telegramId};
      this.telegramMessageQueue[messageId] = {
        id: messageId,
        telegramId,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: dataSend,
      };
    });
    this.process();
  }

  private process() {
    if (this.isRunning) {
      return;
    }
    const processInterval = setInterval(() => {
      if (Object.keys(this.telegramMessageQueue).length === 0) {
        clearInterval(processInterval);
        this.isRunning = false;
        return;
      }

      // Get TELEGRAM_RATE_LIMIT messages and send
      const messages = Object.values(this.telegramMessageQueue).slice(0, EnvVars.Telegram.RateLimit);
      const promises = [];
      messages.forEach(async (message) => {
        const { data} = message;
        promises.push(this.sendTelegramMessage(data))
        delete this.telegramMessageQueue[message.id];
      });
    }, EnvVars.Telegram.IntervalTime);

    this.isRunning = true;
  }

  async sendTelegramMessage(data: any){
    await fetch(
      this.getUrlApi('sendPhoto'),
      {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(data),
        redirect: 'follow',
      }).then(response => response.json());
  }

  // Singleton this class
  private static _instance: TelegramService;
  public static get instance() {
    if (!this._instance) {
      this._instance = new TelegramService(SequelizeServiceImpl);
    }

    return this._instance;
  }
}
