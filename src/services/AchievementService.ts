import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import {
  Achievement,
  AchievementCategory, AchievementLog, AchievementLogStatus,
  AchievementMilestone,
  AchievementType,
  Condition,
  Game,
  Metric,
  Task,
} from '@src/models';
import {AccountService} from '@src/services/AccountService';
import {QueryTypes} from 'sequelize';
import {AchievementCenterService} from '@src/services/AchievementCenterService';

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
  data: {
    achievementCategory: AchievementCategoryContentCms[];
    achievement: AchievementContentCms[];
  }
}


export interface MilestoneOutput {
  id: number
  name: string,
  nps: number,
  status: AchievementLogStatus,
  startTime?: Date,
  endTime?: Date,
}
export interface AchievementOutput {
  achievementName: string;
  achievementId: number;
  icon?: string;
  slug?: string;
  milestones: MilestoneOutput[];
}

export interface AchievementDataOutput {
  achievementCategoryName: string;
  achievementCategoryId: number;
  achievements: AchievementOutput[];
}

export interface AchievementRecord {
  achievementCategoryName: string;
  achievementCategoryId: number;
  achievementName: string;
  achievementId: number;
  milestoneId: number
  milestoneName: string,
  slug: string,
  icon: string,
  nps: number,
  status: AchievementLogStatus,
}

export interface AchievementClaimParams {
  milestoneId: number,
}

export type AchievementData =  Achievement & {milestones: AchievementMilestone[]};

const achievementCenterService = AchievementCenterService.instance;

export class AchievementService {
  private achievementMap: Record<string, AchievementData> | undefined;
  private milestoneMap: Record<string, AchievementMilestone> | undefined;

  constructor(private sequelizeService: SequelizeService) {}

  async buildMap() {
    const data = (await Achievement.findAll()) as AchievementData[];
    const achievementMap: Record<string, AchievementData> = {};
    for (const item of data) {
      item.milestones = await AchievementMilestone.findAll({where: {achievementId: item.id}});
      achievementMap[item.id.toString()] = item;
    }

    this.achievementMap = achievementMap;
    return achievementMap;
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

  async syncData(dataContentCms: AchievementDataContentCms) {
    const response = {
      success: true,
    };
    const achievementCategory = dataContentCms.data.achievementCategory;
    const achievement = dataContentCms.data.achievement;
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
      for (const metric of metrics) {
        const contentGameId = metric.games;
        const contentTaskId = metric.tasks;
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

      if (existed) {
        await existed.update(itemData);
      } else {
        itemData.contentId = item.id;
        existed = await Achievement.create(itemData);
      }
      if (existed) {
        for (const milestone of milestones) {
          const milestoneData = { ...milestone, achievementId: existed.id  } as unknown as AchievementMilestone;
          const existedMilestone = await AchievementMilestone.findOne({ where: {
            contentId: milestone.id, achievementId: existed.id } });

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
    const achievementMap = !!this.achievementMap ? this.achievementMap : await this.buildMap();
    return achievementMap[id.toString()];
  }

  async findMilestone(id: number) {
    const dataMap = !!this.milestoneMap ? this.milestoneMap : await this.buildMilestoneMap();
    return dataMap[id.toString()];
  }

  async getMilestoneList() {
    return !!this.milestoneMap ? this.milestoneMap : await this.buildMilestoneMap();
  }

  async getList() {
    const achievementMap = !!this.achievementMap ? this.achievementMap : await this.buildMap();
    return Object.values(achievementMap);
  }

  async triggerAchievement(accountId:number,type: AchievementType){
    // Trigger achievement
    const account = await AccountService.instance.findById(accountId);
    if (!account){
      return;
    }

    const achievementList = (await this.getList()).filter(item => item.type === type);

    if (achievementList.length > 0){
      for (const achievement of achievementList) {
        achievementCenterService.checkAccountAchievement(accountId, achievement.id).catch(console.error);
      }
    }
  }

  async claimAchievement(accountId: number, milestoneId: number){
    const account = await AccountService.instance.findById(accountId);
    if (!account){
      throw new Error('Account not found');
    }
    
    const milestone = await this.findMilestone(milestoneId);
    if (!milestone){
      throw new Error('Milestone not found');
    }
    
    const achievement = await this.findAchievement(milestone.achievementId);
    if (!achievement){
      throw new Error('Achievement not found');
    }
    
    const log = await AchievementLog.findOne({where: {accountId,
      achievementMilestoneId: milestone.id, achievementId: achievement.id}});
    if (!log){
      throw new Error('Achievement log not found');
    }

    if (log.status === AchievementLogStatus.CLAIMED){
      throw new Error('Achievement already claimed');
    }

    log.status = AchievementLogStatus.CLAIMED;
    log.completedAt = new Date();
    await log.save();
    await AccountService.instance.addAccountPoint(accountId, log.pointReward);

    return {
      success: true,
    };
  }

  async getAchievementList(accountId: number){
    const account = await AccountService.instance.findById(accountId);
    if (account) {
      const sql = `
          with achievement_account_log as (
            select * from achievement_log where "accountId" = :accountId
        )
        SELECT
            a."achievementCategoryId" as "achievementCategoryId",
            ac.name as "achievementCategoryName",
            am."achievementId",
            a.name as "achievementName",
            a.icon,
            am.id as "milestoneId",
            am.name as "milestoneName",
            al."pointReward" as nps,
            a.slug,
            al.status
        FROM achievement a
        JOIN achievement_category ac on ac.id = a."achievementCategoryId"
        JOIN achievement_milestone am on a.id = am."achievementId"
        left join achievement_account_log al on am.id = al."achievementMilestoneId";
        `;
        
      const result = await SequelizeServiceImpl.sequelize.query<AchievementRecord>(sql, {
        type: QueryTypes.SELECT,
        replacements: {
          accountId,
        },
      });

      // Map result to AchievementDataOutput
      const resultMap: Record<string, AchievementDataOutput> = {};
      for (const item of result) {
        const {achievementCategoryId, achievementCategoryName, achievementId,
          achievementName, milestoneId, milestoneName, nps, slug, icon, status} = item;

        if (!resultMap[achievementCategoryId]) {
          resultMap[achievementCategoryId] = {
            achievementCategoryName,
            achievementCategoryId,
            achievements: [],
          };
        }

        const category = resultMap[achievementCategoryId];
        const achievementIndex = category.achievements.findIndex(item => item.achievementId === achievementId);
        if (achievementIndex === -1) {
          category.achievements.push({
            achievementName: achievementName,
            achievementId,
            slug,
            icon,
            milestones: [],
          });
        }
        
        const achievementItem = category.achievements.find(item => item.achievementId === achievementId);
        if (achievementItem) {
          achievementItem.milestones.push({id: milestoneId, name: milestoneName, nps, status});
        }
      }
      return Object.values(resultMap);
    }
    return [];
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
