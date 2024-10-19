import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import Game from '@src/models/Game';
import {
  Task,
  TaskCategory,
  TaskHistory,
  TaskHistoryStatus,
} from '@src/models';
import {AccountService} from '@src/services/AccountService';
import {dateDiffInDays} from '@src/utils/date';
import {Op, QueryTypes} from 'sequelize';
import {CacheService} from '@src/services/CacheService';
import {v4} from 'uuid';
import {AchievementService, AchievementType} from '@src/services/AchievementService';
import logger from 'jet-logger';

export interface TaskContentCms {
    id: number,
    tokenPrice: number,
    slug: string,
    documentId: string,
    name: string,
    description: string,
    url: string,
    icon: string,
    itemReward: number,
    gameId: number,
    categoryId: number,
    pointReward: number,
    effectDuration: number,
    interval: number,
    startTime: Date,
    endTime: Date,
    share_leaderboard: JSON,
    zealyId: string,
    zealyType: string,
}

export interface TaskSubmitParams {
    taskId: number,
    extrinsicHash?: string,
    network?: string,
}

interface TaskHistoryLog {
    taskHistoryId: number,
    status: TaskHistoryStatus,
    daysDiff: number,
    completedAt: Date
}

type TaskHistoryRecord = Task & TaskHistory & TaskHistoryLog;
const accountService = AccountService.instance;
const cacheService = CacheService.instance;

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
      const existed = await Task.findOne({ where: { documentId: item.documentId }});
      // @ts-ignore
      itemData.share_leaderboard = null;
      if (item.share_leaderboard) {
        // @ts-ignore
        itemData.share_leaderboard = JSON.stringify(item.share_leaderboard);
      }

      // Check if game exists
      if (item.gameId) {
        const gameData = await Game.findOne({where: {documentId: item.gameId}});
        if (!gameData) {
          continue;
        }
        itemData.gameId = gameData.id;
      }
      // Check if category exists
      if (item.categoryId) {
        const categoryData = await TaskCategory.findOne({where: {documentId: item.categoryId}});
        if (!categoryData) {
          continue;
        }
        itemData.categoryId = categoryData.id;
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
    const currentTime = new Date().getTime();
    return Object.values(taskMap).filter((item) => {
      if (item.startTime && item.endTime) {
        const startTime = item.startTime.getTime();
        const endTime = item.endTime.getTime();
        return currentTime >= startTime && currentTime <= endTime;
      }
      return true;
    });
  }

  async checkCompleteTask(userId: number, taskId: number) {
    let completed = false;
    const task = await this.findTask(taskId);
    if (!task) {
      return {completed};
    }
    const interval = task.interval;
    if (task.onChainType && interval > 0){

      const latestLast = await TaskHistory.findAll({
        where: {taskId: task.id, accountId: userId, status: {
          [Op.not]: TaskHistoryStatus.FAILED,
        }},
        order: [['createdAt', 'DESC']],
        limit: 1,
      });
      const now = new Date();
      if (latestLast.length > 0) {
        const lastSubmit = latestLast[0];
        const diffInDays = dateDiffInDays(lastSubmit.createdAt, now);
        if (diffInDays < interval) {
          completed = true;
        }
      }
      const taskUniqueKey = `task_on_chain:${task.id}:${userId}`;
      const taskUniqueValue = await cacheService.redisClient.get(taskUniqueKey);

      if (!completed){
        const taskUniqueValue = v4();
        await cacheService.redisClient.set(taskUniqueKey, taskUniqueValue, { EX: 30 });
      }
      return {completed, isSubmitting: !!taskUniqueValue};
    }

    const taskHistory = await TaskHistory.findOne({
      where: {taskId, accountId: userId, status: TaskHistoryStatus.COMPLETED},
    });
    if (taskHistory) {
      completed = true;
    }

    return {completed};
  }

  async listTaskHistory(userId: number) {
    const sql = `
            SELECT t.*,
                   extract(day from now() - th."createdAt"::date) as "daysDiff",
                   th.id                                          as "taskHistoryId",
                   th.status,
                   case
                       when t."onChainType" is null and th."completedAt" is null then th."createdAt"
                       else th."completedAt" end                  as "completedAt"
            FROM task AS t
                     LEFT JOIN task_history th ON t.id = th."taskId" AND th."accountId" = ${userId}
            order by th."createdAt" desc;
        `;
    const data = await this.sequelizeService.sequelize.query<TaskHistoryRecord>(sql, {
      type: QueryTypes.SELECT,
    });
    if (!data) {
      return [];
    }

    const mapTask = data.reduce((acc: Record<string, TaskHistoryRecord[]>, item: TaskHistoryRecord) => {
      if (!acc[item.id]) {
        acc[item.id] = [];
      }
      acc[item.id].push(item);

      return acc;
    }, {});

    const result: TaskHistoryRecord[] = [];
    const keys = Object.keys(mapTask);
    for (const key of keys) {
      const items = mapTask[key];
      const item = items[0];
      if (item && item.interval && item.interval > 0) {
        let check = false;
        for (const task of items) {
          const {daysDiff, interval} = task;
          const diffInDays = parseInt(String(daysDiff ?? '0'));
          const isTaskOnChainSuccess = !(task.onChainType && task.status === TaskHistoryStatus.FAILED);
          if (diffInDays < interval && isTaskOnChainSuccess) {
            check = true;
            break;
          }
        }
        //  if daily task is not completed, remove task history
        if (!check) {
          // @ts-ignore
          item.taskHistoryId = null;
          // @ts-ignore
          item.status = null;
          // @ts-ignore
          item.completedAt = null;
        }
        result.push(item);
      } else {
        result.push(item);
      }
    }
    return result;
  }

  async findTask(taskId: number) {
    const taskMap = !!this.taskMap ? this.taskMap : await this.buildMap();
    return taskMap[taskId.toString()];
  }

  async submit(userId: number, taskId: number, extrinsicHash?: string | undefined, network?: string | undefined) {
    // Get basic data
    const task = await this.findTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    if (!userId || userId === 0) {
      throw new Error('User not found');
    }
    const account = await accountService.findById(userId);
    if (!account || !account.isEnabled) {
      throw new Error('Your account is suspended');
    }

    // Check if task already submitted
    const latestLast = await TaskHistory.findAll({
      where: {taskId: task.id, accountId: userId},
      order: [['createdAt', 'DESC']],
      limit: 1,
    });

    // Validate task submission
    const interval = task.interval;
    if (latestLast.length > 0 && (!interval || interval <= 0)) {
      throw new Error('Task already submitted');
    }

    // Validate task time
    const now = new Date();
    const currentTime = now.getTime();

    if (task.startTime) {
      const startTime = task.startTime.getTime();
      if (currentTime < startTime) {
        throw new Error('Task is not started yet');
      }
    }

    if (task.endTime) {
      const endTime = task.endTime.getTime();
      if (currentTime > endTime) {
        throw new Error('Task is already ended');
      }
    }

    // Validate repeat task
    if (latestLast.length > 0 && interval > 0) {
      const lastSubmit = latestLast[0];
      const diffInDays = dateDiffInDays(lastSubmit.createdAt, now);
      const isCompleted = !lastSubmit.extrinsicHash || (lastSubmit.extrinsicHash && lastSubmit.status !== TaskHistoryStatus.FAILED);
      if (diffInDays < interval && isCompleted) {
        throw new Error('Task is not ready to be submitted yet');
      }
    }

    const dataCreate = {
      taskId: task.id,
      accountId: userId,
      pointReward: task.pointReward,
    } as TaskHistory;
    if (task.onChainType) {
      if (!extrinsicHash) {
        throw new Error('Extrinsic hash is required');
      }
      const taskHistory = await TaskHistory.findOne({
        where: {extrinsicHash},
      });
      if (taskHistory) {
        throw new Error('Extrinsic hash already used');
      }
      dataCreate.extrinsicHash = extrinsicHash;
      dataCreate.network = network;
      dataCreate.status = TaskHistoryStatus.CHECKING;
      dataCreate.retry = 0;
    } else {
      dataCreate.status = TaskHistoryStatus.COMPLETED;
    }

    dataCreate.completedAt = now;

    // Create task history
    await TaskHistory.create(dataCreate);

    if (task.onChainType) {
      AchievementService.instance.triggerAchievement(account.id, AchievementType.TASK).catch(console.error);
      logger.info('Call trigger Achievement');
    }
    // Add point to account
    await AccountService.instance.addAccountPoint(userId, task.pointReward);

    return {
      success: true,
      isOpenUrl: true,
    };
  }

  async buildMap() {
    const data = await Task.findAll();
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
