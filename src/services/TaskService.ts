import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import Game from '@src/models/Game';
import {Account, AirlyftEvent, Task, TaskCategory, TaskHistory, TaskHistoryStatus} from '@src/models';
import {AccountService} from '@src/services/AccountService';
import {dateDiffInDays} from '@src/utils/date';
import {QueryTypes} from 'sequelize';
import {AirlyftService} from '@src/services/AirlyftService';
import EnvVars from '@src/constants/EnvVars';


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
    completedAt: Date,
}

type TaskHistoryRecord = Task & TaskHistoryLog;
const accountService = AccountService.instance;
const airlyftService = AirlyftService.instance;

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
      // @ts-ignore
      itemData.share_leaderboard = null;
      if (item.share_leaderboard) {
        // @ts-ignore
        itemData.share_leaderboard = JSON.stringify(item.share_leaderboard);
      }

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

  async checkCompleteTask(userId: number, taskId: number) {
    let completed = false;
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
      if (task.airlyftType){
        return {
          success: true,
          isOpenUrl: false,
        };
      }
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
    let isOpenUrl = true;
    if (task.airlyftId && task.airlyftType) {
      const airlyftUserId = await airlyftService.getAirlyftUserIdByAddress(account.address);
      if (airlyftUserId){
        const checkSuccess = await this.checkTaskAirlyft(task, airlyftUserId);
        if (!checkSuccess) {
          return {
            success: false,
            isOpenUrl: isOpenUrl,
          };
        }else {
          isOpenUrl = false;
        }
      }else {
        return {
          success: false,
          isOpenUrl: isOpenUrl,
        };
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

    // Add point to account
    await AccountService.instance.addAccountPoint(userId, task.pointReward);

    return {
      success: true,
      isOpenUrl: isOpenUrl,
    };
  }

  //
  async checkTaskAirlyft(task: Task, userId: string) {
    const taskIds = [task.airlyftId];
    const eventId = task.airlyftEventId;
    const event = await AirlyftEvent.findOne(
      {where: {
        userId: userId,
        taskId: task.airlyftId,
        eventId: task.airlyftEventId,
        status: 'VALID',
      }},
    );
    if (event){
      return true;
    }
    try {
      const data = await airlyftService.eventSubmissions(eventId, taskIds, userId);
      return !(!data || (data.errors && data.errors.length > 0));
    }catch (e) {
      console.log('error airlyft', e);
      return false;
    }

  }

  async createTaskHistory(taskId: number, accountId: number) {
    const task = await Task.findByPk(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const account = await accountService.findById(accountId);
    if (!account || !account.isEnabled) {
      throw new Error('Your account is suspended');
    }
    const existed = await TaskHistory.findOne({
      where: {taskId, accountId},
    });
    if (existed) {
      return;
    }
    
    const data = {
      taskId,
      accountId,
      status: TaskHistoryStatus.COMPLETED,
      completedAt: new Date(),
      pointReward: task.pointReward,
    } as TaskHistory;
    await TaskHistory.create(data);
    // Add point to account
    await AccountService.instance.addAccountPoint(accountId, task.pointReward);
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
