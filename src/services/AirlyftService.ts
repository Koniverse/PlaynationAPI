import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import EnvVars from '@src/constants/EnvVars';
import fetch from 'node-fetch';
import {EventSubmissionsResponse} from '@src/types';
import {Account, AirlyftAccount, AirlyftEvent, Task} from '@src/models';
import {TaskService} from '@src/services/TaskService';
export interface AirlyftEventWebhook {
  userId: string;
  provider: string;
  providerId: string;
  xp: number;
  points: number;
  data: JSON;
  taskId: string;
  eventId: string;
  tasktype: string;
  apptype: string;
  participationStatus: string;
}
export interface AirlyftSyncParams {
  userId: string;
  address: string;
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
  
  async getAirlyftUserId(telegramId: number) {
    const user = await AirlyftAccount.findOne({
      where: {
        telegramId: String(telegramId),
      },
    });
    if (user){
      return user.userId;
    }
    return null;
  }

  async getAirlyftUserIdByAddress(address: string) {
    const user = await AirlyftAccount.findOne({
      where: {
        address,
      },
    });
    if (user){
      return user.userId;
    }
    return null;
  }

  async syncWebhook(eventWebhook: AirlyftEventWebhook) {
    if (!eventWebhook || (eventWebhook && !eventWebhook.userId)){
      throw new Error('Event webhook not found');
    }

    const {provider, providerId, xp, points, taskId,
      eventId, tasktype, apptype, data, participationStatus} = eventWebhook;
    const userId = eventWebhook.userId || '';
    const airlyftEvent: AirlyftEvent = {
      userId,
      provider,
      providerId,
      xp,
      point: points,
      taskId,
      eventId,
      tasktype,
      apptype,
      content: eventWebhook,
      data,
      status: participationStatus,
    } as unknown as AirlyftEvent;
    
    let airlyftAccount = await AirlyftAccount.findOne({
      where: {
        userId: userId,
      },
    });
    if (!airlyftAccount){
      airlyftAccount = await AirlyftAccount.create({userId} as unknown as AirlyftAccount);
    }
    if (provider === 'TELEGRAM'){
      airlyftAccount.telegramId = providerId;
    }else if(provider === 'DISCORD'){
      airlyftAccount.discordId = providerId;
    }else if(provider === 'TWITTER'){
      airlyftAccount.twitterId = providerId;
    }else if (provider === 'EVM_BLOCKCHAIN'){
      airlyftAccount.evmAddress = providerId;
    }
    await airlyftAccount.save();
    
    const task = await Task.findOne({
      where: {
        airlyftId: taskId,
        airlyftEventId: eventId,
      },
    });
    if (task && participationStatus === 'VALID'){
      const isTaskSync = task.airlyftType === 'telegram-sync';
      if (isTaskSync && provider === 'TELEGRAM' && providerId && userId){
        await this.addAccountAirlyft(task.id, providerId);
      }else {
        const airlyftAccount = await AirlyftAccount.findOne({
          where: {
            userId: userId,
          },
        });
        if  (airlyftAccount){
          const accountList = await Account.findAll({
            where: {
              address: airlyftAccount.address,
              isEnabled: true,
            },
          });
          if (accountList && accountList.length > 0){
            for (const account of accountList) {
              await TaskService.instance.createTaskHistory(task.id, account.id);
            }
          }
        }
      }
    }

    await AirlyftEvent.create(airlyftEvent);

    return true;
  }
  async addAccountAirlyft(taskId: number,providerId: string) {
    const accountList = await Account.findAll({
      where: {
        telegramId: Number(providerId),
        isEnabled: true,
      },
    });
    if (!accountList || accountList.length === 0) {
      throw new Error('Account not found');
    }
    for (const account of accountList) {
      await TaskService.instance.createTaskHistory(taskId, account.id);
    }
    return true;
  }
  async syncAccount(userId: string, address: string) {

    const airlyftAccount = await AirlyftAccount.findOne({
      where: {
        userId,
      },
    });
    if (airlyftAccount){
      return;
    }
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
      await TaskService.instance.createTaskHistory(taskTelegramSync.id, account.id);
    }
    return true;

  }


  async syncAccountByAddress(userId: string, address: string) {
    const taskTelegramSync = await Task.findOne({
      where: {
        airlyftType: 'sync',
      },
    });
    if (!taskTelegramSync) {
      throw new Error('Task not found');
    }
    const account = await Account.findOne({
      where: {
        address,
        isEnabled: true,
      },
    });
    if (!account) {
      throw new Error('Account not found');
    }
    const  airlyftAccount = await AirlyftAccount.findOne({
      where: {
        userId: userId,
        address,
      },
    });
    if (!airlyftAccount){
      await AirlyftAccount.create({userId, address} as unknown as AirlyftAccount);
    }
    await TaskService.instance.createTaskHistory(taskTelegramSync.id, account.id);
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
