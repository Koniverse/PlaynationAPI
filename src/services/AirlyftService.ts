import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import EnvVars from '@src/constants/EnvVars';
import fetch from 'node-fetch';
import {createPromise, PromiseObject} from '@src/utils';
import {v4} from 'uuid';
import {ResponseZealy, WebhookZealy} from '@src/types';
import {Task, Account} from '@src/models';
import {TaskService} from '@src/services/TaskService';

type ZealyRequestParams = unknown;

interface ZealyAction {
    id: string,
    action: ZealyActionRoutes;
    version: string;
    method: string;
    data: ZealyRequestParams;
    promiseHandler: PromiseObject<any>
}

export enum ZealyActionRoutes {
    ClaimedQuestsReview = 'claimed-quests/review', // duyệt nhiệm vụ
    ReviewQuest = 'reviews', // lấy danh sách nhiệm vụ
}

export class AirlyftService {
  private actionQueue: Record<string, ZealyAction> = {};
  private isRunning = false;

  constructor(private sequelizeService: SequelizeService) {
  }


  public async addAction<T>(action: ZealyActionRoutes, version: string, method: string, data: unknown) {
    const promiseHandler = createPromise<T>();

    const actionObj: ZealyAction = {
      id: v4(),
      action,
      version,
      method,
      data,
      promiseHandler,
    };

    this.actionQueue[actionObj.id] = actionObj;
    this.process();

    return promiseHandler.promise;
  }

  private process() {
    if (this.isRunning) {
      return;
    }

    const processInterval = setInterval(() => {
      if (Object.keys(this.actionQueue).length === 0) {
        clearInterval(processInterval);
        this.isRunning = false;
        return;
      }

      // Get TELEGRAM_RATE_LIMIT messages and send
      const actions = Object.values(this.actionQueue).slice(0, EnvVars.Zealy.RateLimit);
      actions.forEach(({id, version, method, action, data, promiseHandler}) => {
        this.runAction(action, version, method, data)
          .then(promiseHandler.resolve)
          .catch(promiseHandler.reject);

        delete this.actionQueue[id];
      });
    }, EnvVars.Zealy.IntervalTime);

    this.isRunning = true;
  }

  getAction(action: ZealyActionRoutes, version = 'v1') {
    let textSub = '';
    if (version === 'v2'){
      textSub = 'public/';
    }
    return `https://api-${version}.zealy.io/${textSub}communities/${EnvVars.Zealy.CommunityName}/${action}`;
  }

  async runAction<T>(action: ZealyActionRoutes, version: string, method: string, data: any) {
    // Khởi tạo URL
    let url = this.getAction(action, version);

    // Nếu method là GET, thêm các tham số từ data vào URL
    if (method.toUpperCase() === 'GET' && data) {
      const params = new URLSearchParams(data);
      url += `?${params.toString()}`;
    }

    // Chuẩn bị các options cho fetch
    const options: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EnvVars.Zealy.Token,
      },
      method: method,
      redirect: 'follow',
    };

    // Nếu method là POST, PUT hoặc PATCH thì thêm data vào body của request
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && data) {
      options.body = JSON.stringify(data);
    }

    // @ts-ignore
    const response = await fetch(url, options);

    return (await response.json()) as T;
  }

  // check user success in Zealy
  async checkQuestZealy(zealyTaskId: string, accountZealyId: string) {
    const questList = await this.addAction<ResponseZealy>(ZealyActionRoutes.ReviewQuest, 'v2', 'GET', {
      'questId': zealyTaskId,
      'userId': accountZealyId,
      'status': 'success',
    });
    if (questList) {
      const {items} = questList;

      if (items.length === 0) {
        return {
          'message': 'Task not completed',
          status: false,
        };
      }
      return {
        'message': 'Success',
        status: true,
      };
    }
  }

  async webhookZealyAsync(body: WebhookZealy) {
  }


  // Singleton this class
  private static _instance: AirlyftService;
  public static get instance() {
    if (!this._instance) {
      this._instance = new AirlyftService(SequelizeServiceImpl);
    }

    return this._instance;
  }
}
