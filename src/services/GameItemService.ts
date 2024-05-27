import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import Game from '@src/models/Game';
import {GameItem} from '@src/models';
import EnvVars from "@src/constants/EnvVars";


export interface GameItemContentCms {
    id: number,
    name: string,
    description: string,
    tokenPrice: number,
    slug: string,
    price: number,
    effectDuration: number,
    gameId: number,
    maxBuy: string,
}

export class GameItemService {
  private gameItemMap: Record<string, GameItem> | undefined;
  constructor(private sequelizeService: SequelizeService) {

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
    await this.buildMap();
    return response;
  }


  async buildMap() {
    const data = await GameItem.findAll();
    const dataMap: Record<string, GameItem> = {};
    data.forEach((item) => {
      dataMap[item.id.toString()] = item;
    });

    this.gameItemMap = dataMap;
    return dataMap;
  }


  async findGameItem(taskId: number) {
    const gameItemMap = !!this.gameItemMap ? this.gameItemMap : await this.buildMap();
    return gameItemMap[taskId.toString()];
  }

  async getConfigBuyEnergy() {
    return {
      success: true,
      energyPrice: EnvVars.Game.EnergyPrice,
      energyBuyLimit: EnvVars.Game.EnergyBuyLimit,
      maxEnergy: EnvVars.Game.MaxEnergy,
      energyOneBuy: EnvVars.Game.EnergyOneBuy,
    };
  }

  async listGameItem() {
    const dataMap = !!this.gameItemMap ? this.gameItemMap : await this.buildMap();
    return Object.values(dataMap);
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
