import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import {Achievement, AchievementCategory, AchievementMilestone} from '@src/models';

export interface MilestonesContentCms {
    id: number;
    name: string;
    conditions_combination: string;
    nps: number;
    conditions: JSON;
    endTime: Date;

}
export interface AchievementContentCms {
  id: number;
  name: string;
  description: string;
  slug: string;
  startTime: Date;
  endTime: Date;
  milestones: MilestonesContentCms[];
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

export class AchievementService {

  constructor(private sequelizeService: SequelizeService) {}

  async syncData(data: AchievementDataContentCms) {
    const response = {
      success: true,
    };
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
      let existed = await Achievement.findOne({ where: { contentId: item.id } });
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
            await AchievementMilestone.create(milestoneData);
          }
        }
      }
    }
    return response;
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
