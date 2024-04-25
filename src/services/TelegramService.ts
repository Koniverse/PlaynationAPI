import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import EnvVars from '@src/constants/EnvVars';
import fetch from 'node-fetch';
import {Account} from '@src/models';
import {TelegramFile, TelegramParams, TelegramResponse, TelegramUserProfilePhotos} from '@src/types';
import {downloadImage} from '@src/utils/download';
import {createPromise, PromiseObject} from '@src/utils';
import {v4} from 'uuid';

export interface TelegramMessageItem {
  id: string,
  telegramId: number;
  data: any;
}

type TelegramRequestParams = unknown;

interface TelegramAction {
  id: string,
  action: string;
  data: TelegramRequestParams;
  promiseHandler: PromiseObject<any>
}

export class TelegramService {
  private telegramActionQueue: Record<string, TelegramAction> = {};
  private isRunning = false;

  constructor(private sequelizeService: SequelizeService) {}

  getBotUrl(action: string){
    return `https://api.telegram.org/bot${EnvVars.Telegram.Token}/${action}`;
  }

  getFileUrl(path: string){
    return `https://api.telegram.org/file/bot${EnvVars.Telegram.Token}/${path}`;
  }

  async sendPhotoToAll(data: TelegramParams){
    const accountDataList = await Account.findAll({
      where: {telegramUsername: 'petermai'},
      order: [['id', 'ASC']]},
    );

    console.log('Send telegram message for all user', accountDataList.length, data);

    const sentMap: Record<number, number> = {};

    // add to queue in memory
    accountDataList.forEach((account) => {
      const telegramId = account.telegramId;

      if (!telegramId || sentMap[telegramId]) {
        return;
      }

      sentMap[telegramId] = telegramId;

      this.addTelegramAction('sendPhoto', {...data, chat_id: telegramId}).catch(console.error);
    });

    this.process();
  }

  async saveTelegramAccountAvatar(telegramId: number) {
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
    const data = await this.addTelegramAction<TelegramUserProfilePhotos>('getUserProfilePhotos', {user_id: telegramId});
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
        const file = await this.addTelegramAction<TelegramFile>('getFile', {file_id});
        if (file && file.ok){
          const {file_path} = file.result;
          if (file_path) {
            return this.getFileUrl(file_path);
          }
        }
      }
    }
    return null;
  }

  public async addTelegramAction<T>(action: string, data: unknown) {
    const promiseHandler = createPromise<TelegramResponse<T>>();

    const actionObj: TelegramAction = {
      id: v4(),
      action,
      data,
      promiseHandler,
    };

    this.telegramActionQueue[actionObj.id] = actionObj;
    this.process();

    return promiseHandler.promise;
  }

  private process() {
    if (this.isRunning) {
      return;
    }

    const processInterval = setInterval(() => {
      if (Object.keys(this.telegramActionQueue).length === 0) {
        clearInterval(processInterval);
        this.isRunning = false;
        return;
      }

      // Get TELEGRAM_RATE_LIMIT messages and send
      const actions = Object.values(this.telegramActionQueue).slice(0, EnvVars.Telegram.RateLimit);
      actions.forEach(({id, action, data, promiseHandler}) => {
        this.runTelegramAction(action, data)
          .then(promiseHandler.resolve)
          .catch(promiseHandler.reject);

        delete this.telegramActionQueue[id];
      });
    }, EnvVars.Telegram.IntervalTime);

    this.isRunning = true;
  }

  async runTelegramAction<T>(action: string, data: any){
    const response = await fetch(
      this.getBotUrl(action),
      {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(data),
        redirect: 'follow',
      });

    return (await response.json()) as T;
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
