import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import Game from '@src/models/Game';
import {CacheService} from '@src/services/CacheService';
import {Task, TaskHistory} from '@src/models';
import {IReq} from '@src/routes/types';
import {Query} from 'express-serve-static-core';
import { AccountService } from './AccountService';


export interface TaskContentCms {
    id: number,
    tokenPrice: number,
    slug: string,
    itemReward: number,
    gameId: number,
    pointReward: string
}

export interface TaskSubmitParams{
  taskId: number,
}

export class TaskService {
  private taskMap: Record<string, Task> | undefined;
  constructor(private sequelizeService: SequelizeService) {

  }

  async syncData(data: TaskContentCms[]) {
    const response = {
      success: true,
    };

    for (const item of data) {
      const itemData = {...item} as unknown as Task;
      const existed = await Task.findOne({where: {contentId: item.id}});

      // Check if game exists
      if (item.gameId) {
        const gameData = await Game.findOne({where: {contentId: item.gameId}});
        if (!gameData) {
          continue;
        }
        itemData.gameId = gameData.id;
      }

      // Sync data
      if (existed) {
        await existed.update(itemData);
      } else {
        itemData.contentId = item.id;
        await Task.create(itemData);
      }
    }

    await this.buildMap();
    return response;
  }


  async listTask() {
    const taskMap = !!this.taskMap ? this.taskMap : await this.buildMap();
    return Object.values(taskMap);
  }

  async listTaskHistory(req: IReq<Query>) {
    const {user} = req;
    if (!user) {
      throw new Error('User not found');
    }
    const sql = `
    SELECT
    task.*,
    case
        when task_history.id is not null and task_history."accountId" = ${user.id} then 1
        else 0
    end  as status
    from task left join task_history on task.id = task_history."taskId"
    `;
    const data = await this.sequelizeService.sequelize.query(sql);
    return data.length > 0 ? data[0] : [];
  }

  async findTask(taskId: number) {
    const taskMap = !!this.taskMap ? this.taskMap : await this.buildMap();
    return taskMap[taskId.toString()];
  }

  async submit(req: IReq<Query>) {
    const params = req.body as unknown as TaskSubmitParams;
    const task = await this.findTask(params.taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    const {user} = req;
    if (!user) {
      throw new Error('User not found');
    }
    const tasHistory = await TaskHistory.findOne({where: {taskId: task.id, accountId: user.id}});
    if (tasHistory) {
      throw new Error('Task already submitted');
    }
    const data = {
      taskId: task.id,
      accountId: user.id,
      pointReward: task.pointReward,
    } as TaskHistory;
    await TaskHistory.create(data);
    await AccountService.instance.addAccountPoint(user.id, task.pointReward);

    return {
      success: true,
    };
  }


  async buildMap() {
    const data = await Task.findAll();
    console.log('data', data)
    const dataMap: Record<string, Task> = {};
    data.forEach((item) => {
      dataMap[item.id.toString()] = item;
    });

    this.taskMap = dataMap;
    return dataMap;
  }

  // Singleton
  private static _instance: TaskService;
  public static get instance() {
    if (!TaskService._instance) {
      TaskService._instance = new TaskService(SequelizeServiceImpl);
    }
    return TaskService._instance;
  }
}
