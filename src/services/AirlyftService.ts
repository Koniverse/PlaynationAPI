import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import EnvVars from '@src/constants/EnvVars';
import fetch from 'node-fetch';
import {EventSubmissionsResponse} from '@src/types';
import {Account, AirlyftEvent, AirlyftEventWebhook, Task} from '@src/models';
import {TaskService} from '@src/services/TaskService';
export interface AirlyftSyncParams {
  userId: string;
}

export interface AirlyftTokenResponse {
  token: string;
  success: boolean;
}

export class AirlyftService {

  private token = '';
  constructor(private sequelizeService: SequelizeService) {
  }

  async eventSubmissions (eventId: string, taskIds: string[], userId:string|null=null) {
    const query = `
        query Data($projectId: ID!, $pagination: PaginationInput!, $where: SubmissionWhereInput!) {
  eventSubmissions(projectId: $projectId, pagination: $pagination, where: $where) {
    data {
      id
      points
      xp
      taskId
      userId
      auth {
        provider
        providerId
        userId
        username
      }
      provider
      providerId
      status
      primaryAuth {
        provider
        providerId
        userId
        username
      }
      hashedIp
    },
    total
  }
}
    `;
    const variables = {
      'projectId': EnvVars.Airlyft.ProjectId,  
      'pagination': {
        'take': 10,
        'skip': 0,
      },
      'where': {
        'eventId': eventId,
        'taskIds': taskIds,
        'status': 'VALID',
      },
    };
    if (userId){
      // @ts-ignore
      variables.where.userId = userId;
    }
    return await this.runAction<EventSubmissionsResponse>(query, variables);
  }
  
  async syncWebhook(eventWebhook: AirlyftEventWebhook) {
    const {userId, provider, providerId, xp, points, taskId, eventId, tasktype, apptype, data} = eventWebhook;
    const webhookData = {...eventWebhook} as unknown as AirlyftEvent;
    if (data){
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      webhookData.data = JSON.parse(data);
    }
    webhookData.content = eventWebhook;
    
    // const task = await Task.findOne({
    //   where: {
    //     airlyftId: taskId,
    //     airlyftEventId: eventId,
    //   },
    // });
    // if (task){
    //   const isTaskSync = task.airlyftType === 'telegram-sync';
    //   if (isTaskSync){
    //     await this.syncAccount(userId);
    //   }else {
    //     const accountList = await Account.findAll({
    //       where: {
    //         airlyftId: userId,
    //         isEnabled: true,
    //       },
    //     });
    //     if (accountList && accountList.length > 0){
    //       for (const account of accountList) {
    //         await TaskService.instance.createTaskHistory(task.id, account.id);
    //       }
    //     }
    //   }
    // }
    
    await AirlyftEvent.create(webhookData);

    return true;
  }
  async syncAccount(userId: string) {
    const taskTelegramSync = await Task.findOne({
      where: {
        airlyftType: 'telegram-sync',
      },
    });
    if (!taskTelegramSync) {
      throw new Error('Task not found');
    }
    const eventId = taskTelegramSync.airlyftEventId;
    const taskIds = [taskTelegramSync.airlyftId];
    const eventSubmissionsData = await this.eventSubmissions(eventId, taskIds, userId);
    if (!eventSubmissionsData || (eventSubmissionsData.errors && eventSubmissionsData.errors.length > 0)) {
      throw new Error('Event submissions not found');
    }
    const data = eventSubmissionsData.data;
    const eventSubmissions = data.eventSubmissions.data.find((item) => item.userId === userId);
    if (!eventSubmissions) {
      throw new Error('Event submissions not found');
    }
    const {auth} = eventSubmissions;
    if (!auth || auth.provider !== 'TELEGRAM') {
      throw new Error('Auth not found');
    }
    const {providerId} = auth;
    if (!providerId) {
      throw new Error('ProviderId not found');
    }
    const accountList = await Account.findAll({
      where: {
        telegramId: providerId,
        isEnabled: true,
      },
    });
    if (!accountList || accountList.length === 0) {
      throw new Error('Account not found');
    }
    for (const account of accountList) {
      account.airlyftId = userId;
      await account.save();
      await TaskService.instance.createTaskHistory(taskTelegramSync.id, account.id);
    }
    return true;

  }
  
  setToken(token: string) {
    this.token = token;
  }

  async getToken() {
    const _token = this.token;
    console.log('token', _token);
    if (!_token){
      const dataResponse = await this.getDataToken<AirlyftTokenResponse>();
      if (dataResponse.success){
        this.setToken(dataResponse.token);
        return dataResponse.token;
      }
    }
    return _token;
  }


  async runAction<T>(query: string, variables: any) {
    // Khởi tạo URL
    const url = EnvVars.Airlyft.Url;
    const token = await this.getToken();
    const options: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      body: JSON.stringify({query, variables}),
      method: 'POST',
      redirect: 'follow',
    };

    // @ts-ignore
    const response = await fetch(url, options);

    return (await response.json()) as T;
  }
  
  
  async getDataToken<T>() {
    const data = {
      'message': EnvVars.Airlyft.Message,
      'signature': EnvVars.Airlyft.Signature,
      'address': EnvVars.Airlyft.Address,
    };
    // Khởi tạo URL
    const url = EnvVars.Airlyft.LoginUrl;
    const options: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      body: JSON.stringify(data),
      method: 'POST',
      redirect: 'follow',
    };

    // @ts-ignore
    const response = await fetch(url, options);

    return (await response.json()) as T;
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
