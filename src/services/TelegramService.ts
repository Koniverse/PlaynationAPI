import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import EnvVars from '@src/constants/EnvVars';
import fetch from 'node-fetch';
import {Account} from '@src/models';
import {TelegramFile, TelegramParams, TelegramResponse, TelegramUserProfilePhotos} from '@src/types';
import {downloadImage} from '@src/utils/download';

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
  getUrlFile(path: string){
    return `https://api.telegram.org/file/bot${EnvVars.Telegram.Token}/${path}`;
  }

  async addTelegramMessage( data: TelegramParams){
    const accountDataList = await Account.findAll({order: [['id', 'ASC']]});

    console.log('Send telegram message for all user', accountDataList.length, data);

    const sentMap: Record<number, number> = {};

    // add to queue in memory
    accountDataList.forEach((account) => {
      const telegramId = account.telegramId;

      if (!telegramId || sentMap[telegramId]) {
        return;
      }

      sentMap[telegramId] = telegramId;

      const messageId = `${telegramId}-${new Date().getTime()}`;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const dataSend = {...data, chat_id: telegramId};
      this.telegramMessageQueue[messageId] = {
        id: messageId,
        telegramId,
        data: dataSend as unknown,
      };
    });
    this.process();
  }
  
  async saveImageTelegram(telegramId: number) {
    const account = await Account.findAll({where: {telegramId}});
    if (account.length === 0) {
      return;
    }
    try {
      const url = await this.getUrlProfile(telegramId);
      let photoUrl;
      if (url){
        photoUrl = `images/telegram/${telegramId}.jpg`;
        const path = `./public/${photoUrl}`;
        await downloadImage(url, path);
      }
      const updateData = {photoUrl: photoUrl, cronAvatar: true};
      const promises = account.map( (account) => {
        return account.update(updateData);
      });
      await Promise.all(promises);
    } catch (error) {
      console.error('Error fetching image:', error);
    }
  }
  
  async  getUrlProfile(telegramId: number) {
    const data = await this.sendActionTelegram('getUserProfilePhotos', {user_id: telegramId}) as TelegramResponse<TelegramUserProfilePhotos>;
    if (!data) {
      return;
    }
    if (data.ok) {
      const {result} = data;
      const {photos, total_count} = result;
      if (total_count > 0) {
      // Get file_id from photo file_size min (last item)
        let minFileSize = 0;
        let file_id;
        photos.forEach(photoArray =>   {
          photoArray.forEach(photo => {
            if (photo.file_size) {
              if(minFileSize === 0){
                minFileSize = photo.file_size;
                file_id = photo.file_id;
              } else if( photo.file_size < minFileSize) {
                minFileSize = photo.file_size;
                file_id = photo.file_id;
              }
            }
          });
        });
        const file = await this.sendActionTelegram('getFile', {file_id}) as TelegramResponse<TelegramFile>;
        if (file && file.ok){
          const {file_path} = file.result;
          if (file_path) {
            return this.getUrlFile(file_path);

          }
        }
      }
    }
    return null;
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
      messages.forEach((message) => {
        this.sendTelegramMessage(message.data).catch(console.error);
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

  async sendActionTelegram(action: string, data: any){
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await fetch(
      this.getUrlApi(action),
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
