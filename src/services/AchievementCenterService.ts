import {v4} from 'uuid';
import {LeaderBoardServiceV2} from '@src/services/LeaderBoardServiceV2';
import {LeaderboardContext, LeaderboardType} from '@src/services/leaderboards/BaseLeaderBoard';
import {
  AchievementLog,
  AchievementLogStatus,
  ComparisonOperator,
  Condition,
  ConditionsCombination,
  Metric,
} from '@src/models';
import {createPromise, PromiseObject} from '@src/utils';
import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import {AchievementService} from '@src/services/AchievementService';
import {LeaderboardItem} from '@src/types';
import {calculateStartAndEnd} from '@src/utils/date';
import logger from 'jet-logger';

// Config values comparison
export type ComparativeValue = Condition & {valueCondition: {point: number, rank: number}};

enum MetricFilterType {
    RANK = 'rank',
    POINT = 'point',
}

type MetricFilter = Metric & {filterType: MetricFilterType};

enum QueueStatus {
    RUNNING = 'running',
    WAITING = 'waiting',
}

interface AchievementQueue {
    accountId: number,
    achievementId: number,
    isProcessing: boolean,
    handler: PromiseObject<any>
}

interface AchievementLogParams {
  accountId: number;
  achievementId: number;
  achievementMilestoneId: number;
  pointReward: number;
  checkCondition: boolean;
  log: AchievementLog | null;
  userConditions: ComparativeValue[];
}

export class AchievementCenterService {
  private queueStatus: QueueStatus = QueueStatus.WAITING;
  private requestMap: Record<string, AchievementQueue> = {};
  constructor(private sequelizeService: SequelizeService) {}

  public async checkAccountAchievement(accountId: number, achievementId: number) {
    const handler = createPromise();
    const id = v4();
    this.requestMap[id] = {accountId, achievementId, isProcessing: false, handler};
    setTimeout(() => {
      this.run().catch(logger.err);
    }, 1000);
    return handler.promise;
  }

  private async run(): Promise<void> {
    if (this.queueStatus === QueueStatus.RUNNING) {
      return;
    }

    this.queueStatus = QueueStatus.RUNNING;
    const entries = Object.entries(this.requestMap);
    // Map request to achievement
    const achievementMap: Record<number, AchievementQueue[]> = {};
    for (const [id, queue] of entries) {
      if (!queue.isProcessing) {
        const { achievementId } = queue;
        queue.isProcessing = true;
        if (achievementMap[achievementId]) {
          achievementMap[achievementId].push(queue);
        } else {
          achievementMap[achievementId] = [queue];
        }
      }
    }
    await this.processAchievement(achievementMap);
  }
  
  private async getAccountMetricData(accountIds: number[], metrics: MetricFilter[]){
    const accountMetricData: Record<string, {point: number, rank: number}> = {};
    for (const metric of metrics) {
      const data = await this.getLeaderBoard(accountIds, metric as LeaderboardItem,metric.filterType, {}, 1000000);
      for (const accountId of accountIds) {
        const account = data.find(item => item.accountInfo.id === accountId);
        if (!account) {
          continue;
        }

        accountMetricData[`${metric.metricId}_${accountId}`] = {
          point: account.point,
          rank: account.rank,
        };
      }
    }
    return accountMetricData;
  }
  
  async getAchievementMetrics(achievementId: number) {
    const achievement = await AchievementService.instance.findAchievement(Number(achievementId));
    if (!achievement) {
      return;
    }
      
    const metrics = achievement.metrics as MetricFilter[];
    if (!metrics) {
      return;
    }

    const milestones = achievement.milestones;
    for (const milestone of milestones) {
      for (const condition of milestone.conditions) {
        const metric = metrics.find(item => item.metricId === condition.metric);
        if (!metric) {
          continue;
        }

        metric.filterType = MetricFilterType.POINT;
        if (condition.comparison.includes('rank')) {
          metric.filterType = MetricFilterType.RANK;
        }
      }
    }
    return metrics;
  }

  private async processAchievement(achievementMap: Record<number, AchievementQueue[]>): Promise<void> {
    // Process achievement
    for (const [achievementId, dataList] of Object.entries(achievementMap)) {
      const achievement = await AchievementService.instance.findAchievement(Number(achievementId));
      if (!achievement) {
        continue;
      }

      const metrics = await this.getAchievementMetrics(achievement.id);
      if (!metrics) {
        continue;
      }

      const accountIds = dataList.map(item => item.accountId);
      const accountMetricData = await this.getAccountMetricData(accountIds, metrics);

      for (const itemData of dataList) {
        // get milestone to achievement cache
        for (const milestone of achievement.milestones) {
          // Check if log cycle
          const log = await AchievementService.instance.getCurrentAchievementLog(achievement, itemData.accountId, milestone.id);
          const success = log &&  log.status !== AchievementLogStatus.PENDING;
          const handler = itemData.handler;
          if (success && log) {
            handler.resolve(false);
            continue;
          }

          const userConditions = milestone.conditions.map(cond => {
            return {...cond, valueCondition: accountMetricData[`${cond.metric}_${itemData.accountId}`]};
          });

          const checkCondition = this.checkConditions(userConditions, milestone.conditions_combination);
          const logData = {
            accountId: itemData.accountId,
            achievementId: Number(achievementId),
            achievementMilestoneId: milestone.id,
            pointReward: milestone.nps,
            checkCondition,
            log,
            userConditions,
          } as AchievementLogParams;
          await this.logAchievement(logData);
          handler.resolve(checkCondition);
        }
      }
    }

    // delete requestMap after process
    for (const [id, queue] of Object.entries(this.requestMap)) {
      if (queue.isProcessing) {
        delete this.requestMap[id];
      }
    }
    this.queueStatus = QueueStatus.WAITING;
  }

  private checkConditions(conditions: ComparativeValue[], combination: ConditionsCombination): boolean {
    const checks = conditions.map(cond => {
      switch (cond.comparison) {
      case ComparisonOperator.GT:
        return cond.valueCondition.point !== undefined && cond.valueCondition.point > cond.value;
      case ComparisonOperator.GTE:
        return cond.valueCondition.point !== undefined && cond.valueCondition.point >= cond.value;
      case ComparisonOperator.LT:
        return cond.valueCondition.point !== undefined && cond.valueCondition.point < cond.value;
      case ComparisonOperator.LTE:
        return cond.valueCondition.point !== undefined && cond.valueCondition.point <= cond.value;
      case ComparisonOperator.EQ:
        return cond.valueCondition.point !== undefined && cond.valueCondition.rank === cond.value;
      case ComparisonOperator.RANK_GT:
        return cond.valueCondition.rank !== undefined && cond.valueCondition.rank > cond.value;
      case ComparisonOperator.RANK_GTE:
        return cond.valueCondition.rank !== undefined && cond.valueCondition.rank >= cond.value;
      case ComparisonOperator.RANK_LT:
        return cond.valueCondition.rank !== undefined && cond.valueCondition.rank < cond.value;
      case ComparisonOperator.RANK_LTE:
        return cond.valueCondition.rank !== undefined && cond.valueCondition.rank <= cond.value;
      case ComparisonOperator.RANK_EQ:
        return cond.valueCondition.rank !== undefined && cond.valueCondition.rank === cond.value;
      default:
        return false;
      }
    });

    return combination === ConditionsCombination.AND ? checks.every(check => check) : checks.some(check => check);
  }

  async logAchievement(logParams: AchievementLogParams): Promise<void> {
    // Todo: Combine many parameters into an object
    // Todo: Why not log another things like ranks...?
    const {accountId, achievementId, achievementMilestoneId, pointReward, checkCondition, log, userConditions} = logParams;
    // Get progress data
    const progress = userConditions.map(cond => {
      let completed = cond.valueCondition.point;
      if (cond.comparison.includes('rank')) {
        completed = cond.valueCondition.rank;
      }
      
      return {
        required: cond.value,
        completed,
        metricId: cond.metric,
      };
    });

    const status = checkCondition ? AchievementLogStatus.CLAIMABLE : AchievementLogStatus.PENDING;

    const logData = {
      accountId,
      achievementMilestoneId,
      achievementId,
      pointReward,
      status,
      progress,
    };
    
    if (log) {
      log.status = status;
      log.progress = progress;
      await log.save();
    }else {
      await AchievementLog.create(logData);
    }
  }

  async getLeaderBoard(accountIds: number[], leaderboard: LeaderboardItem, filterType: MetricFilterType, context: LeaderboardContext = {}, limit = 100){
    let startTime = leaderboard.startTime as unknown as string;
    let endTime = leaderboard.endTime as unknown as string;

    let gameIds = leaderboard.games;
    let taskIds = leaderboard.tasks;
    if (context.games){
      gameIds = context.games;
    }
    if (context.tasks){
      taskIds = context.tasks;
    }
    const metadata = leaderboard.metadata;
    const type = leaderboard.type;
    if (leaderboard.specialTime){
      const timeData = calculateStartAndEnd(leaderboard.specialTime);
      startTime = timeData.start  as unknown as string;
      endTime = timeData.end as unknown as string;
    }
    const inputs = {
      type: type as LeaderboardType ,
      startTime,
      endTime,
      gameIds,
      taskIds,
      limit,
      metadata,
    };

    if (filterType === MetricFilterType.POINT) {
      inputs.limit = accountIds.length;
      return await LeaderBoardServiceV2.instance.getAccountData(accountIds, inputs);
    }

    return await LeaderBoardServiceV2.instance.getLeaderBoardData(accountIds, inputs);
  }

  // Singleton
  private static _instance: AchievementCenterService;
  public static get instance() {
    if (!AchievementCenterService._instance) {
      AchievementCenterService._instance = new AchievementCenterService(SequelizeServiceImpl);
    }
    return AchievementCenterService._instance;
  }
}
