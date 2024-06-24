import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import EnvVars from '@src/constants/EnvVars';
import fetch from 'node-fetch';
import {createPromise, PromiseObject} from '@src/utils';
import {v4} from 'uuid';
import {ResponseZealy, WebhookZealy} from '@src/types';
import {AccountService} from '@src/services/AccountService';
import {ZealyEvent, Task, Account} from '@src/models';
import {TaskService} from '@src/services/TaskService';
import * as console from 'node:console';

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

export class ZealyService {
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
    console.log('response', response);

    return (await response.json()) as T;
  }

  // check user success in Zealy
  async checkQuestZealy(zealyTaskId: string, accountTaskId: string) {
    const questList = await this.addAction<ResponseZealy>(ZealyActionRoutes.ReviewQuest, 'v2', 'GET', {
      'questId': zealyTaskId,
      'userId': accountTaskId,
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
    const {data} = body;
    const {user, quest, taskInputs} = data;
    const taskValue = taskInputs.find((task) => task.taskType === 'text');
    let value = '';
    if (taskValue) {
      value = taskValue?.input?.value;
    }
    const questId = quest.id;
    const claimId = quest.claimId;
    const task = await Task.findOne({
      where: {
        zealyId: questId,
      },
    });
    let claimStatus = 'fail';
    if (task && task.zealyType  === 'sync' && body.type === 'QUEST_CLAIMED'){
      const account = await Account.findOne({
        where: {
          address: value,
        },
      });
      if (account){
        account.zealyId = user.id;
        account.twitterId = user.twitter?.id || '';
        account.discordId = user.discord?.id || '';
        await account.save();
        await TaskService.instance.createTaskHistory(task.id, account.id);
        claimStatus = 'success';
      }

      const dataReview = {
        status: claimStatus,
        claimedQuestIds: [claimId],
        comment: 'Auto validate',
      };
      await this.addAction(ZealyActionRoutes.ClaimedQuestsReview, 'v1', 'POST', dataReview);
    }

    const dataCreate = {
      zealyUserId: body.data.user.id,
      claimId: body.data.quest.claimId,
      questId: questId,
      webhookType: body.type,
      status: body.data.status,
      content: body,
      value: value,
    };
    await ZealyEvent.create(dataCreate as unknown as ZealyEvent);
  }


  // Singleton this class
  private static _instance: ZealyService;
  public static get instance() {
    if (!this._instance) {
      this._instance = new ZealyService(SequelizeServiceImpl);
    }

    return this._instance;
  }
}
