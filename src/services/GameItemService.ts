import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import Game from '@src/models/Game';
import {CacheService} from '@src/services/CacheService';
import {GameItem} from '@src/models';


export interface GameItemContentCms {
    id: number,
    name: string,
    description: string,
    tokenPrice: number,
    slug: string,
    price: number,
    gameId: number,
    maxBuy: string,
}

export class GameItemService {
  constructor(private sequelizeService: SequelizeService) {

  }

  async syncGameItemList() {
    await CacheService.instance.isReady;
    const client = CacheService.instance.redisClient;
    await client.del('game_item_list');
  }

  async syncData(data: GameItemContentCms[]) {
    const response = {
      success: true,
    };
    for (const item of data) {
      const itemData = {...item} as unknown as GameItem;
      const existed = await GameItem.findOne({where: {contentId: item.id}});
      const gameData = await Game.findOne({where: {contentId: item.gameId}});
      if (!gameData) {
        continue;
      }
      itemData.gameId = gameData.id;
      if (existed) {
        await existed.update(itemData);
      } else {
        itemData.contentId = item.id;
        await GameItem.create(itemData);
      }
    }
    await this.syncGameItemList();
    return response;
  }

  async listGameItem() {
    await CacheService.instance.isReady;
    const client = CacheService.instance.redisClient;
    const dataCache = await client.get('game_item_list');
    if (dataCache) {
      return JSON.parse(dataCache) as GameItem[];
    }

    const data = await GameItem.findAll();

    client.set('game_item_list', JSON.stringify(data));

    return data;
  }

  // Singleton
  private static _instance: GameItemService;
  public static get instance() {
    if (!GameItemService._instance) {
      GameItemService._instance = new GameItemService(SequelizeServiceImpl);
    }
    return GameItemService._instance;
  }
}
