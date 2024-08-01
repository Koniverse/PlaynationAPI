import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import {Game, KeyValueStore, Task} from '@src/models';
import {LeaderboardContentCms} from '@src/types';


export class KeyValueStoreService {
  private dataMap: Record<string, object> | undefined;

  constructor(private sequelizeService: SequelizeService) {}
  
  

  async syncData(data: LeaderboardContentCms) {
    try {
      const { data: leaderboardData, leaderboard_general } = data;
      await this.update('leaderboard_general', leaderboard_general);
      const leaderboardMap: any[] = [];
      for (const item of leaderboardData) {
        const itemData = {...item};
        const contentGameId = item.games;
        const contentTaskId = item.tasks;
        const gameList = await Game.findAll({where: {contentId: contentGameId}});
        // @ts-ignore
        itemData.games = [];
        if(gameList) {
          // @ts-ignore
          itemData.games = gameList.map(game => game.id);
        }
        const taskList = await Task.findAll({where: {contentId: contentTaskId}});
        // @ts-ignore
        itemData.tasks = [];
        if(taskList) {
          // @ts-ignore
          itemData.tasks = taskList.map(task => task.id);
        }
        leaderboardMap.push(itemData);
      }
      await this.update('leaderboard_map', leaderboardMap);
      await this.buildMap();
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  async buildMap() {
    const data = await KeyValueStore.findAll();
    const dataMap: Record<string, object> = {};
    data.forEach((item) => {
      dataMap[item.key] = item.value;
    });

    this.dataMap = dataMap;
    return dataMap;
  }

  async getList() {
    const dataMap = !!this.dataMap ? this.dataMap : await this.buildMap();

    return dataMap;
  }
  
  async get(id: string) {
    const dataMap = !!this.dataMap ? this.dataMap : await this.buildMap();
    
    return dataMap[id];
  }
  
  async update(key: string, value: object) {
    const keyValue = await KeyValueStore.findOne({where: {key}});
    if (keyValue) {
      await keyValue.update({value} as unknown as KeyValueStore);
    } else {
      await KeyValueStore.create({key, value} as unknown as KeyValueStore);
    }
  }

  // Singleton
  private static _instance: KeyValueStoreService;
  public static get instance() {
    if (!KeyValueStoreService._instance) {
      KeyValueStoreService._instance = new KeyValueStoreService(SequelizeServiceImpl);
    }
    return KeyValueStoreService._instance;
  }
}
