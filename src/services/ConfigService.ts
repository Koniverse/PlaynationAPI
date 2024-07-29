import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import {
  Account, Config,
  Game,
  GameData,
  GameInventoryItem,
  GameInventoryItemStatus,
  GamePlay,
  LeaderboardPerson,
} from '@src/models';
import { v4 } from 'uuid';
import { AccountService } from '@src/services/AccountService';
import { QueryTypes } from 'sequelize';

export interface ConfigContentCms {
  id: number;
  name: string;
  slug: string;
  value: JSON;
}

export interface GameInventoryItemParams {
  gameInventoryItemId: number;
}

export class ConfigService {
  private dataMap: Record<string, Config> | undefined;

  constructor(private sequelizeService: SequelizeService) {}
  async syncData(data: ConfigContentCms[]) {
    const response = {
      success: true,
    };

    for (const item of data) {
      const itemData = { ...item } as unknown as Config;
      const existed = await Config.findOne({ where: { slug: item.slug } });
      // itemData.rankDefinition = JSON.stringify(item.rank_definition);
      if (existed) {
        await existed.update(itemData);
      } else {
        await Config.create(itemData);
      }
    }
    await this.buildMap();
    return response;
  }

  async buildMap() {
    const data = await Config.findAll();
    const dataMap: Record<string, Config> = {};
    data.forEach((item) => {
      dataMap[item.id.toString()] = item;
    });

    this.dataMap = dataMap;
    return dataMap;
  }

  async getList() {
    const dataMap = !!this.dataMap ? this.dataMap : await this.buildMap();

    return Object.values(dataMap);
  }

  async findGame(gameId: number) {
    const gameMap = !!this.dataMap ? this.dataMap : await this.buildMap();

    return gameMap[gameId.toString()];
  }

  // Singleton
  private static _instance: ConfigService;
  public static get instance() {
    if (!ConfigService._instance) {
      ConfigService._instance = new ConfigService(SequelizeServiceImpl);
    }
    return ConfigService._instance;
  }
}
