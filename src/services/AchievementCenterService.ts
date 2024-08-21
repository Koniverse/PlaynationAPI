import {v4} from 'uuid';
import {LeaderBoardServiceV2} from '@src/services/LeaderBoardServiceV2';
import {
  LeaderboardContext,
  LeaderboardType,
} from '@src/services/leaderboards/BaseLeaderBoard';
import {AchievementLog, ComparisonOperator, Condition, ConditionsCombination, Metric} from '@src/models';
import {createPromise, PromiseObject} from '@src/utils';
import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import {AchievementService} from '@src/services/AchievementService';
import * as console from 'node:console';
import {LeaderboardItem} from '@src/types';
import {calculateStartAndEnd} from '@src/utils/date';
// Config values comparison
export type ComparativeValue = Condition & {valueCondition: {point: number, rank: number}};

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

export class AchievementCenterService {
  private queueStatus: QueueStatus = QueueStatus.WAITING;
  private requestMap: Record<string, AchievementQueue> = {};
  constructor(private sequelizeService: SequelizeService) {}
  public async checkAccountAchievement(accountId: number, achievementId: number) {
    const handler = createPromise();
    const id = v4();
    this.requestMap[id] = {accountId, achievementId, isProcessing: false, handler};
    setTimeout(() => {
      this.run().catch(console.error);
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
  
  private async getAccountMetricData(accountIds: number[], metrics: Metric[]){
    const accountMetricData: Record<string, {point: number, rank: number}> = {};
    for (const metric of metrics) {
      // Todo: add leaderboard function to achievement service map list accountIds
      // Todo: change limit accountId length
      const data = await this.getLeaderBoard(0, metric as LeaderboardItem, {}, 100000);
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

  private async processAchievement(achievementMap: Record<number, AchievementQueue[]>): Promise<void> {
    // Process achievement
    for (const [achievementId, dataList] of Object.entries(achievementMap)) {
      const achievement = await AchievementService.instance.findAchievement(Number(achievementId));
      if (!achievement) {
        continue;
      }
      const metrics = achievement.metrics;
      if (!metrics) {
        continue;
      }

      const accountIds = dataList.map(item => item.accountId);
      const accountMetricData = await this.getAccountMetricData(accountIds, metrics);

      for (const itemData of dataList) {
        // get milestone to achievement cache
        for (const milestone of achievement.milestones) {
          const log = await AchievementLog.findOne({where: {accountId: itemData.accountId,
            achievementMilestoneId: milestone.id, achievementId}});
          const handler = itemData.handler;
          if (log) {
            handler.resolve(false);
            continue;
          }

          const userConditions = milestone.conditions.map(cond => {
            return {...cond, valueCondition: accountMetricData[`${cond.metric}_${itemData.accountId}`]};
          });

          const isCheck = this.checkConditions(userConditions, milestone.conditions_combination);
          if  (isCheck) {
            await this.logAchievement(itemData.accountId, milestone.id, Number(achievementId), milestone.nps);
          }
          handler.resolve(isCheck);
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

  async logAchievement(accountId: number, achievementMilestoneId: number, achievementId: number, pointReward: number): Promise<void> {
    const logData = {
      accountId,
      achievementMilestoneId,
      achievementId,
      pointReward,
    };
    await AchievementLog.create(logData);
  }

  async getLeaderBoard(accountId: number, leaderboard: LeaderboardItem, context: LeaderboardContext = {}, limit = 100){
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

    return await LeaderBoardServiceV2.instance.getLeaderBoardData(accountId, {
      type: type as LeaderboardType ,
      startTime,
      endTime,
      gameIds,
      taskIds,
      limit,
      metadata,
    });
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
