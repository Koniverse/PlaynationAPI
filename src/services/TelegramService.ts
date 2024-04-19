import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import EnvVars from '@src/constants/EnvVars';
import fetch from 'node-fetch';
import {Account} from "@src/models";

export interface TelegramParams {
    telegramId: number;
    telegramUsername: string;

}
export class TelegramService {
  public dataTelegramList: Record<string, TelegramParams> = {};
  constructor(private sequelizeService: SequelizeService) {}

  removeTelegramList(telegramId: string){
    delete this.dataTelegramList[telegramId];
  }
  async getTelegramList(){
    console.log('Get telegram list')
    console.log(Object.keys(this.dataTelegramList).length);
    if (Object.keys(this.dataTelegramList).length === 0) {
      const telegramList = await Account.findAll({});
      this.dataTelegramList = telegramList.reduce((acc, item) => {
        console.log('item', item.telegramId)
        acc[item.telegramId] = {
          telegramId: item.telegramId,
          telegramUsername: item.telegramUsername,
        };
        return acc;
      }, {} as Record<string, TelegramParams>);
    }
    return this.dataTelegramList;
  }
  async getTelegramAccountData(){
    console.log('Get telegram account data');
    const telegramId = '1842790242';
    const message = 'Hello world234';
    const data = {
      chat_id: telegramId,
      photo: 'https://booka-media.koni.studio/image_0cc2798a8a.png',
      caption: message,
      'parse_mode': 'html',
    };
    const rs = await this.sendTelegramMessage(telegramId,data);
  }

  getUrlApi(action: string){
    return `https://api.telegram.org/bot${EnvVars.Telegram.Token}/${action}`;
  }

  async sendTelegramMessage(telegramId: string,data: any){
    console.log(this.getUrlApi('sendPhoto'));
    const rs = await fetch(
      this.getUrlApi('sendPhoto'),
      {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(data),
        redirect: 'follow',
      }).then(response => response.json());
    console.log(rs);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return rs?.data || [];
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
