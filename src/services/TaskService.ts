import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import Game from '@src/models/Game';
import {Task, TaskHistory} from '@src/models';
import {AccountService} from '@src/services/AccountService';


export interface TaskContentCms {
    id: number,
    tokenPrice: number,
    slug: string,
    name: string,
    description: string,
    icon: string,
    itemReward: number,
    gameId: number,
    pointReward: number,
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

  async listTaskHistory(userId: number) {
    const sql = `
        SELECT t.*,
               CASE
                   WHEN EXISTS (SELECT 1 FROM task_history AS th WHERE th."taskId" = t.id and th."accountId" = ${userId})
                       THEN 1
                   ELSE 0 END AS status
        FROM task AS t;
    `;
    const data = await this.sequelizeService.sequelize.query(sql);
    return data.length > 0 ? data[0] : [];
  }

  async findTask(taskId: number) {
    const taskMap = !!this.taskMap ? this.taskMap : await this.buildMap();
    return taskMap[taskId.toString()];
  }

  async submit(userId: number, data: TaskSubmitParams) {
    const task = await this.findTask(data.taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    if (!userId || userId === 0) {
      throw new Error('User not found');
    }
    const tasHistory = await TaskHistory.findOne({where: {taskId: task.id, accountId: userId}});
    if (tasHistory) {
      throw new Error('Task already submitted');
    }

    await TaskHistory.create({
      taskId: task.id,
      accountId: userId,
      pointReward: task.pointReward,
    });

    await AccountService.instance.addAccountPoint(userId, task.pointReward);

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
