import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import EnvVars from '@src/constants/EnvVars';
import fetch from 'node-fetch';
import {EventSubmissionsResponse} from '@src/types';
import {Account, Task} from '@src/models';
import {TaskService} from '@src/services/TaskService';
import {CacheService} from '@src/services/CacheService';
const cacheService = CacheService.instance;
export interface AirlyftSyncParams {
  userId: string;
}

export interface AirlyftTokenResponse {
  token: string;
  success: boolean;
}

export class AirlyftService {
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

  getKeyToken(){
    return 'airlyft_token';
  }
  
  async setToken(token: string) {
    const key = this.getKeyToken();
    await cacheService.redisClient.set(key, token, { EX: 60 * 60 * 12 });
  }

  async getToken() {
    const key = this.getKeyToken();
    const token = await cacheService.redisClient.get(key);
    if (!token){
      const dataResponse = await this.getDataToken<AirlyftTokenResponse>();
      if (dataResponse.success){
        await this.setToken(dataResponse.token);
        return dataResponse.token;
      }
    }
    return token;
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
