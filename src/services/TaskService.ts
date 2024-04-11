import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import Game from '@src/models/Game';
import {CacheService} from '@src/services/CacheService';
import {GameItem, Task} from "@src/models";
import * as console from "node:console";


export interface TaskContentCms {
    id: number,
    tokenPrice: number,
    slug: string,
    itemReward: number,
    gameId: number,
    pointReward: string
}

export class TaskService {
  constructor(private sequelizeService: SequelizeService) {

  }

  async generateDefaultData() {
  }

  async syncTaskList() {
    await CacheService.instance.isReady;
    const client = CacheService.instance.redisClient;
    await client.del('task_list');
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

    await this.syncTaskList();
    return response;
  }

  async listGame() {
    await CacheService.instance.isReady;
    const client = CacheService.instance.redisClient;
    const dataCache = await client.get('task_list');
    if (dataCache) {
      return JSON.parse(dataCache) as Task[];
    }

    const data = await Task.findAll();

    client.set('task_list', JSON.stringify(data));

    return data;
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
