import {v4} from 'uuid';
import {LeaderBoardServiceV2} from '@src/services/LeaderBoardServiceV2';
import {LeaderBoardQueryInputRaw} from '@src/services/leaderboards/BaseLeaderBoard';
import {ComparisonOperator, Condition, ConditionsCombination, Metric} from '@src/models';
import {createPromise, PromiseObject} from '@src/utils';
import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import {AchievementService} from '@src/services/AchievementService';
// Cấu hình cho mỗi điều kiện
export type ComparativeValue = Condition & {valueCondition: number};

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
  public async checkAccountAchievement(accountId: number, achievementId: number): Promise<void> {
    const handler = createPromise();
    const id = v4();
    this.requestMap[id] = {accountId, achievementId, isProcessing: false, handler};
    setTimeout(() => {
      this.run().catch(console.error);
    }, 1000);
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
      const accountMetricData: Record<string, number> = {};

      for (const metric of metrics) {
        // Todo: add leaderboard function to achievement service map list accountIds
        const data = await LeaderBoardServiceV2.instance.getLeaderBoardData(0, metric as LeaderBoardQueryInputRaw);
        for (const itemData of dataList) {
          const account = data.find(item => item.accountInfo.id === itemData.accountId);
          if (!account) {
            continue;
          }
          accountMetricData[`${metric.id}_${itemData.accountId}`] = account.point;

        }
      }
      for (const itemData of dataList) {
      // Todo: Get user data
        // get milestone to achievement cache
        for (const milestone of achievement.milestones) {
          const userConditions = milestone.conditions.map(cond => {
            return {...cond, valueCondition: accountMetricData[`${cond.metric.id}_${itemData.accountId}`]};
          });

          const isCheck = this.checkConditions(userConditions, milestone.conditions_combination);
          if  (isCheck) {
            await this.logAchievement(itemData.accountId, milestone.id, Number(achievementId), milestone.nps);
          }
          const handler = itemData.handler;
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

  // Todo: add comparison

  private checkConditions(conditions: ComparativeValue[], combination: ConditionsCombination): boolean {
    const checks = conditions.map(cond => {
      switch (cond.comparison) {
      case ComparisonOperator.GT:
        return cond.value !== undefined && cond.valueCondition > cond.value;
      case ComparisonOperator.LT:
        return cond.value !== undefined && cond.valueCondition < cond.value;
      case ComparisonOperator.EQ:
        return cond.value !== undefined && cond.valueCondition === cond.value;
      default:
        return false;
      }
    });

    return combination === ConditionsCombination.AND ? checks.every(check => check) : checks.some(check => check);
  }

  // Todo: save data in achievement_log
  async logAchievement(userId: number, milestoneId: number, achievementId: number, point: number): Promise<void> {
    const logData = {
      userId,
      milestoneId,
      achievementId,
      timestamp: new Date(),
      point,
    };
    console.log('Logging achievement:', logData);
    // Thực hiện lưu logData vào cơ sở dữ liệu hoặc hệ thống lưu trữ khác
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
