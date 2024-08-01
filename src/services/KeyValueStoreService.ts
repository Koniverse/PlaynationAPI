import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import { KeyValueStore } from '@src/models';


export class KeyValueStoreService {
  private dataMap: Record<string, KeyValueStore> | undefined;

  constructor(private sequelizeService: SequelizeService) {}

  async buildMap() {
    const data = await KeyValueStore.findAll();
    const dataMap: Record<string, KeyValueStore> = {};
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

  // Singleton
  private static _instance: KeyValueStoreService;
  public static get instance() {
    if (!KeyValueStoreService._instance) {
      KeyValueStoreService._instance = new KeyValueStoreService(SequelizeServiceImpl);
    }
    return KeyValueStoreService._instance;
  }
}
