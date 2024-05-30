import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import Game from '@src/models/Game';
import {Task, TaskCategory, TaskHistory, TaskHistoryStatus} from '@src/models';
import {AccountService} from '@src/services/AccountService';


export interface TaskContentCms {
    id: number,
    tokenPrice: number,
    slug: string,
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
}

export interface TaskSubmitParams{
  taskId: number,
  extrinsicHash?: string,
  network?: string,
}

export interface TaskHistoryParams{
  taskHistoryId: number
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
      console.log(item);
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
      // Check if category exists
      if (item.categoryId) {
        const categoryData = await TaskCategory.findOne({where: {contentId: item.categoryId}});
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

  async checkCompleteTask(userId: number, taskHistoryId: number) {
    let completed = false;
    const taskHistory = await TaskHistory.findByPk(taskHistoryId);
    if (taskHistory && taskHistory.accountId === userId) {
      completed = taskHistory.status === TaskHistoryStatus.COMPLETED;
    }
    return {completed};

  }
  async listTaskHistory(userId: number) {
    const sql = `
         SELECT t.*,
        th.id AS "taskHistoryId",
        th.status,
        case
            when t."onChainType" is null or th."completedAt" is null then th."createdAt"
        else th."completedAt" end as "completedAt"
        FROM task AS t
        LEFT JOIN task_history th ON t.id = th."taskId" AND th."accountId" = ${userId}
    `;
    const data = await this.sequelizeService.sequelize.query(sql);
    return data.length > 0 ? data[0] : [];
  }

  async findTask(taskId: number) {
    const taskMap = !!this.taskMap ? this.taskMap : await this.buildMap();
    return taskMap[taskId.toString()];
  }

  async submit(userId: number, taskId: number, extrinsicHash?: string|undefined, network?: string|undefined) {
    // Get basic data
    const task = await this.findTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    if (!userId || userId === 0) {
      throw new Error('User not found');
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
      const lastSubmitTime = lastSubmit.createdAt.getTime();
      const diff = currentTime - lastSubmitTime;
      const diffInSeconds = diff / 1000;
      if (diffInSeconds < interval) {
        throw new Error('Task is not ready to be submitted yet');
      }
    }
    const dataCreate = {
      taskId: task.id,
      accountId: userId,
      pointReward: task.pointReward,
    } as TaskHistory;
    let isOnChain = false;
    if (task.onChainType) {
      if (!extrinsicHash) {
        throw new Error('Extrinsic hash is required');
      }
      dataCreate.extrinsicHash = extrinsicHash;
      dataCreate.network = network;
      dataCreate.status = TaskHistoryStatus.CHECKING;
      dataCreate.retry = 0;
      isOnChain = true;
    } else {
      dataCreate.status = TaskHistoryStatus.COMPLETED;
      dataCreate.completedAt = now;
    }

    // Create task history
    await TaskHistory.create(dataCreate);

    if (!isOnChain) {
      // Add point to account
      await AccountService.instance.addAccountPoint(userId, task.pointReward);
    }

    return {
      success: true,
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
