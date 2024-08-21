import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import {Achievement, AchievementCategory, AchievementMilestone, Condition, Game, Metric, Task} from '@src/models';

export interface MilestonesContentCms {
    id: number;
    name: string;
    conditions_combination: string;
    nps: number;
    conditions: Condition[];

}
export interface AchievementContentCms {
  id: number;
  name: string;
  description: string;
  slug: string;
  startTime: Date;
  endTime: Date;
  milestones: MilestonesContentCms[];
  metrics: Metric[];
}

export interface AchievementCategoryContentCms {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
}
export interface AchievementDataContentCms {
  achievementCategory: AchievementCategoryContentCms[];
  achievement: AchievementContentCms[];
}

export type AchievementData =  Achievement & {milestones: AchievementMilestone[]};

export class AchievementService {
  private dataMap: Record<string, AchievementData> | undefined;
  private milestoneMap: Record<string, AchievementMilestone> | undefined;

  constructor(private sequelizeService: SequelizeService) {}




  async buildMap() {
    const data = (await Achievement.findAll()) as AchievementData[];
    const dataMap: Record<string, AchievementData> = {};
    for (const item of data) {
      const milestones = await AchievementMilestone.findAll({where: {achievementId: item.id}});
      item.milestones = milestones;
      dataMap[item.id.toString()] = item;
    }

    this.dataMap = dataMap;
    return dataMap;
  }
  async buildMilestoneMap() {
    const data = await AchievementMilestone.findAll();
    const dataMap: Record<string, AchievementMilestone> = {};
    data.forEach((item) => {
      dataMap[item.id.toString()] = item;
    });

    this.milestoneMap = dataMap;
    return dataMap;
  }

  async syncData(data: AchievementDataContentCms) {
    const response = {
      success: true,
    };
    console.log(data);
    const achievementCategory = data.achievementCategory;
    const achievement = data.achievement;
    for (const item of achievementCategory) {
      const itemData = { ...item } as unknown as AchievementCategory;
      const existed = await AchievementCategory.findOne({ where: { contentId: item.id } });
      if (existed) {
        await existed.update(itemData);
      } else {
        itemData.contentId = item.id;
        await AchievementCategory.create(itemData);
      }
    }

    for (const item of achievement) {
      const itemData = { ...item } as unknown as Achievement;
      const milestones = item.milestones;
      const metrics = item.metrics;
      let existed = await Achievement.findOne({ where: { contentId: item.id } });
      for (let metric of metrics) {
        console.log(metric);
        console.log(metric.games, metric.tasks);
        const contentGameId = metric.games;
        const contentTaskId = metric.tasks;
        console.log(contentGameId, contentTaskId)
        const gameList = await Game.findAll({where: {contentId: contentGameId}});
        metric.games = [];
        if(gameList) {
          metric.games = gameList.map(game => game.id);
        }
        const taskList = await Task.findAll({where: {contentId: contentTaskId}});
        metric.tasks = [];
        if(taskList) {
          metric.tasks = taskList.map(task => task.id);
        }
      }
      // Todo: map games and tasks in metric
      if (existed) {
        await existed.update(itemData);
      } else {
        itemData.contentId = item.id;
        existed = await Achievement.create(itemData);
      }
      if (existed) {
        for (const milestone of milestones) {
          const milestoneData = { ...milestone, achievementId: existed.id  } as unknown as AchievementMilestone;
          const existedMilestone = await AchievementMilestone.findOne({ where: { contentId: milestone.id, achievementId: existed.id } });
          if (existedMilestone) {
            await existedMilestone.update(milestoneData);
          } else {
            milestoneData.achievementId = existed.id;
            milestoneData.contentId = milestone.id;
            await AchievementMilestone.create(milestoneData);
          }
        }
      }
    }
    await Promise.all([this.buildMilestoneMap(), this.buildMap()]);
    return response;
  }
  async findAchievement(id: number) {
    const dataMap = !!this.dataMap ? this.dataMap : await this.buildMap();

    return dataMap[id.toString()];
  }
  async findMilestone(id: number) {
    const dataMap = !!this.milestoneMap ? this.milestoneMap : await this.buildMilestoneMap();

    return dataMap[id.toString()];
  }
  async getMilestoneList() {
    return !!this.milestoneMap ? this.milestoneMap : await this.buildMilestoneMap();
  }
  async trigger(){

  }
  async claimAchievement(milestoneId: number, userId: number){

  }
  async getAchievementList(){

  }
  // Singleton
  private static _instance: AchievementService;
  public static get instance() {
    if (!AchievementService._instance) {
      AchievementService._instance = new AchievementService(SequelizeServiceImpl);
    }
    return AchievementService._instance;
  }
}
