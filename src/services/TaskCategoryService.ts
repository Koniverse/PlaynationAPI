import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import TaskCategory from '@src/models/TaskCategory';


export interface TaskCategoryContentCms  {
    id: number,
    slug: string,
    name: string,
    description: string,
    icon: string,
    active: boolean,
}

export class TaskCategoryService {
  private dataMap: Record<string, TaskCategory> | undefined;
  constructor(private sequelizeService: SequelizeService) {

  }

  async syncData(data: TaskCategoryContentCms []) {
    const response = {
      success: true,
    };

    for (const item of data) {
      const itemData = {...item} as unknown as TaskCategory;
      const existed = await TaskCategory.findOne({where: {contentId: item.id}});
      if (existed) {
        await existed.update(itemData);
      } else {
        itemData.contentId = item.id;
        await TaskCategory.create(itemData);
      }
    }

    await this.buildMap();
    return response;
  }


  async list() {
    const dataMap = !!this.dataMap ? this.dataMap : await this.buildMap();
    return Object.values(dataMap);
  }


  async buildMap() {
    const data = await TaskCategory.findAll();
    const dataMap: Record<string, TaskCategory> = {};
    data.forEach((item) => {
      dataMap[item.id.toString()] = item;
    });

    this.dataMap = dataMap;
    return dataMap;
  }

  // Singleton
  private static _instance: TaskCategoryService;
  public static get instance() {
    if (!TaskCategoryService._instance) {
      TaskCategoryService._instance = new TaskCategoryService(SequelizeServiceImpl);
    }
    return TaskCategoryService._instance;
  }
}
