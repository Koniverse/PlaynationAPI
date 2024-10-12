import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import {
  Achievement, AchievementLog, AchievementLogStatus,
  AchievementMilestone,
  Condition,
  Game, LogViewType,
  Metric, RepeatableType,
  Task, TaskCategory, TaskCategoryType, TaskHistoryStatus,
} from '@src/models';
import {AccountService} from '@src/services/AccountService';
import {QueryTypes} from 'sequelize';
import {AchievementCenterService} from '@src/services/AchievementCenterService';
import {calculateStartAndEnd} from '@src/utils/date';
import {LeaderboardType} from '@src/services/leaderboards/BaseLeaderBoard';

export interface MilestonesContentCms {
    id: number;
    name: string;
    slug: string;
    conditions_combination: string;
    nps: number;
    conditions: Condition[];

}
export interface AchievementContentCms {
  id: number;
  name: string;
  documentId: string;
  taskCategoryId: string;
  description: string;
  slug: string;
  startTime: Date;
  endTime: Date;
  milestones: MilestonesContentCms[];
  metrics: Metric[];
}

export interface AchievementDataContentCms {
  data: AchievementContentCms[];
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

type MissionStatusType = TaskHistoryStatus & AchievementLogStatus;

export interface MissionRecord {
  categoryName: string;
  categoryType: TaskCategoryType;
  categoryId: number;
  repeatable: RepeatableType;
  type: string;
  logViewType: LogViewType;
  conditions: Condition[];
  name: string;
  id: number;
  milestoneId: number;
  earned: number;
  milestoneName: string,
  slug: string;
  icon: string,
  nps: number,
  status: MissionStatusType,
  createdAt: Date,
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

export enum AchievementType {
  LOGIN = 'login',
  TASK = 'task',
  GAME = 'game',
  REFERRAL = 'referral',
}

// Map achievement type to leaderboard type
export const LEADERBOARD_ACHIEVEMENT_TYPE_MAP = {
  [AchievementType.LOGIN]: [LeaderboardType.ALL_NPS, LeaderboardType.ACCOUNT_DAILY_QUANTITY],
  [AchievementType.TASK]: [LeaderboardType.TASK_NPS, LeaderboardType.TASK_QUANTITY, LeaderboardType.ALL_NPS],
  [AchievementType.GAME]: [LeaderboardType.ALL_NPS, LeaderboardType.GAME_CASUAL_NPS, LeaderboardType.GAME_CASUAL_POINT,
    LeaderboardType.GAME_CASUAL_QUANTITY, LeaderboardType.GAME_FARMING_POINT, LeaderboardType.GAME_FARMING_TOTAL_POINT,
    LeaderboardType.GAME_FARMING_EARN_SPEED],
  [AchievementType.REFERRAL]: [LeaderboardType.REFERRAL_NPS, LeaderboardType.REFERRAL_QUANTITY,
    LeaderboardType.REFERRAL_INVITE_TO_PLAY_NPS, LeaderboardType.ALL_NPS],
};

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
    const achievement = dataContentCms.data;

    for (const item of achievement) {
      const itemData = { ...item } as unknown as Achievement;
      const milestones = item.milestones;
      const metrics = item.metrics;
      let existed = await Achievement.findOne({ where: { documentId: item.documentId }});
      for (const metric of metrics) {
        const contentGameId = metric.games;
        const contentTaskId = metric.tasks;
        const gameList = await Game.findAll({where: {documentId: contentGameId}});
        metric.games = [];
        if(gameList) {
          metric.games = gameList.map(game => game.id);
        }
        const taskList = await Task.findAll({where: {documentId: contentTaskId}});
        metric.tasks = [];
        if(taskList) {
          metric.tasks = taskList.map(task => task.id);
        }
      }
      const existedCategory = await TaskCategory.findOne({ where: { documentId: item.taskCategoryId } as never });
      if (!existedCategory) {
        continue;
      }
      itemData.taskCategoryId = existedCategory.id;

      itemData.contentId = item.id;

      if (existed) {
        await existed.update(itemData);
      } else {
        existed = await Achievement.create(itemData);
      }
      if (existed) {
        for (const milestone of milestones) {
          const milestoneData = { ...milestone, achievementId: existed.id  } as unknown as AchievementMilestone;
          const existedMilestone = await AchievementMilestone.findOne({ where: {
            slug: milestone.slug, achievementId: existed.id } });

          milestoneData.contentId = milestone.id;
          if (existedMilestone) {
            await existedMilestone.update(milestoneData);
          } else {
            milestoneData.achievementId = existed.id;
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

    // Get all achievement of type
    const achievementList = await this.getFindAchievementByMetricType(type);

    if (achievementList.length > 0){
      for (const achievement of achievementList) {
        achievementCenterService.checkAccountAchievement(accountId, achievement.id).catch(console.error);
      }
    }
  }

  // Get achievement by metric type
  // Achievement type is used to get the list of achievement that is related to the metric type
  async getFindAchievementByMetricType(metricType: AchievementType){
    const achievementList = await this.getList();
    const metricMap = LEADERBOARD_ACHIEVEMENT_TYPE_MAP[metricType] || [];
    if (metricMap) {
      return achievementList.filter(item => item.metrics.some(metric => metricMap.includes(metric.type as LeaderboardType)));
    }
    return [];
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

    if (log.status === AchievementLogStatus.PENDING){
      throw new Error('Achievement not completed');
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

  async getMissionList(accountId: number){
    const account = await AccountService.instance.findById(accountId);
    if (account) {
      // Get all achievement and task history log
      // Achievement log get all achievement log of account and check if it is in the time range
      // Task history log get all task history log of account and check if it is in the time range
      // Combine all data and sort by id and milestone id
      // Todo: Get achievement progress data in json
      const sql = `
      with achievement_account_log as (
            select al.* from achievement_log al 
                     JOIN achievement a on al."achievementId" = a.id
                     where "accountId" = :accountId 
                       and (
                           (a.repeatable = 'daily' and al."createdAt" >= :startTime and al."createdAt" <= :endTime)
                         or (a.repeatable = 'weekly' and al."createdAt" >= :startWeeklyTime and al."createdAt" <= :endWeeklyTime)
                            or a.repeatable = 'non_repeatable')
                     order by al."createdAt" desc
        ),
        task_history_log as (
            select th.* from task_history th
                        JOIN task t on th."taskId" = t.id
            where "accountId" = :accountId
              and (
                  (t."onChainType" = 'attendance' and th."createdAt" >= :startTime and th."createdAt" <= :endTime)
                      or t."onChainType" is null )
                        order by th."createdAt" desc
        ), all_data as (
        SELECT
            a."taskCategoryId" as "categoryId",
            a.repeatable::text as "repeatable",
            ac.type as "categoryType",
            ac.name as "categoryName",
            a."logViewType",
            'achievement' as "type",
            am."achievementId" as id,
            a.name,
            0 as "interval",
            a.icon,
            am.id as "milestoneId",
            am.name as "milestoneName",
            am.nps as "pointReward",
            am.conditions as "conditions",
            a.slug,
            al.status::text as status,
            al."createdAt",
            al."completedAt",
            '' as "onChainType",
            '' as network
        FROM achievement a
        JOIN task_category ac on ac.id = a."taskCategoryId"
        JOIN achievement_milestone am on a.id = am."achievementId"
        left join achievement_account_log al on a.id = al."achievementId" and am.id = al."achievementMilestoneId"
        UNION ALL
        SELECT t."categoryId" as "categoryId",
            case when t."onChainType" = 'attendance' then 'daily' else 'non_repeatable' end as "repeatable",
            tc.type as "categoryType",
            tc.name as "categoryName",
            'single'as "logViewType",
            'task' as "type",
            t.id as id,
            t.name,
            t."interval",
            t.icon,
            0 as "milestoneId",
            '' as "milestoneName",
            t."pointReward",
            '{}'::jsonb as "conditions",
            t.slug,
            th.status::text as status,
            th."createdAt", 
            th."completedAt",
            t."onChainType",
            t.network
        FROM task t
        JOIN task_category tc on tc.id = t."categoryId"
        left join task_history_log th on t.id = th."taskId"
      )
      select * from all_data order by id desc, "milestoneId" desc;
        `;

      // Get start and end time of daily and weekly
      const dailyTime = calculateStartAndEnd('daily');
      const weeklyTime = calculateStartAndEnd('weekly');
      const startTime = dailyTime.start;
      const endTime = dailyTime.end;
      const startWeeklyTime = weeklyTime.start;
      const endWeeklyTime = weeklyTime.end;
        
        
      const result = await SequelizeServiceImpl.sequelize.query<MissionRecord>(sql, {
        type: QueryTypes.SELECT,
        replacements: {
          accountId,
          startTime,
          endTime,
          startWeeklyTime,
          endWeeklyTime,
        },
      });

      return result.map((item) => {
        if (item.type === 'achievement') {
          // Todo:  Get achievement progress data in json
        }
        return item;
      });
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
