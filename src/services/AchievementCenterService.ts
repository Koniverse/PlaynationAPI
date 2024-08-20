import { v4 as uuidv4 } from 'uuid';
import EventEmitter from 'eventemitter3';
import {LeaderboardItem} from '@src/types';
import {LeaderBoardServiceV2} from '@src/services/LeaderBoardServiceV2';
import {LeaderBoardQueryInputRaw} from '@src/services/leaderboards/BaseLeaderBoard';

// Cấu hình cho các milestone
export interface MilestoneConfig {
  conditions_combination: 'and' | 'or'; // Cách kết hợp các điều kiện
  conditions: Condition[]; // Danh sách các điều kiện
  nps: number,
  id: number,
  name: string
}
type Metric = LeaderboardItem & {metricId: string};
// Cấu hình cho mỗi điều kiện
export interface Condition {
  metric: Metric; // Thông tin leaderboard
  comparison: 'gt' | 'gte' | 'lt'| 'eq'; // Điều kiện so sánh
  value: number; // Giá trị để so sánh
}

// Dữ liệu sự kiện Achievement
export interface AchievementEventData {
  id: string;
  milestoneId: number;
  achievementId: string;
  result?: boolean;
  error?: Error;
}

// Map sự kiện cho emitter
export interface AchievementServiceEventMap {
  'achievement_unlocked': AchievementEventData;
  'achievement_error': AchievementEventData;
}

export class AchievementCenterService {
  private emitter = new EventEmitter<AchievementServiceEventMap>();
  private milestoneConfigs: Map<number, MilestoneConfig> = new Map(); // milestoneId -> MilestoneConfig
  private achievementQueue: Map<number, Set<number>> = new Map(); // milestoneId -> Set<userId>
  private queueStatus: 'running' | 'waiting' = 'waiting';


  public async addUserAchievement(userId: number, milestone: MilestoneConfig): Promise<void> {
    const userQueue = this.achievementQueue.get(milestone.id) || new Set();
    userQueue.add(userId);
    this.achievementQueue.set(milestone.id, userQueue);
    this.milestoneConfigs.set(milestone.id, milestone);

    setTimeout(() => {
      this.run().catch(console.error);
    }, 1000);
  }

  private async run(): Promise<void> {
    if (this.queueStatus === 'running') {
      return;
    }

    this.queueStatus = 'running';

    const milestoneIds = Array.from(this.achievementQueue.keys());
    const promises = milestoneIds.map(milestoneId => this.processMilestone(milestoneId));

    await Promise.all(promises);
    this.queueStatus = 'waiting';
  }

  private async processMilestone(milestoneId: number): Promise<void> {
    const userIds = this.achievementQueue.get(milestoneId) || new Set();
    const config = this.milestoneConfigs.get(milestoneId);
    if (!config) return;

    const leaderboardValues = await this.getLeaderboardValues(config.conditions.map(cond => cond.metric));

    for (const userId of userIds) {
      // Todo: Get user data
      const userConditions = config.conditions.map(cond => ({
        ...cond,
      }));

      const isUnlocked = await this.checkConditions(userConditions, config.conditions_combination);

      if (isUnlocked) {
        const eventData: AchievementEventData = {
          id: uuidv4(),
          milestoneId,
          achievementId: uuidv4(),
          result: isUnlocked,
        };
        this.emitter.emit('achievement_unlocked', eventData);
        await this.logAchievement(userId, milestoneId, 0, 0);
      }
    }

    this.achievementQueue.delete(milestoneId);
  }

  // Todo: add comparison

  private async checkConditions(conditions: Condition[], combination: 'and' | 'or'): Promise<boolean> {
    const checks = conditions.map(cond => {
      switch (cond.comparison) {
      case 'gt':
        return cond.value !== undefined && cond.value > cond.value;
      case 'lt':
        return cond.value !== undefined && cond.value < cond.value;
      case 'eq':
        return cond.value !== undefined && cond.value === cond.value;
      default:
        return false;
      }
    });

    return combination === 'and' ? checks.every(check => check) : checks.some(check => check);
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

  // Todo:  get info leaderboard in array metrics
  private async getLeaderboardValues(leaderboardIds: Metric[]): Promise<Record<string, Record<string, number>>> {
    const values: Record<string, any> = {};

    for (const item of leaderboardIds) {
      values[item.metricId] = await LeaderBoardServiceV2.instance.getLeaderBoardData(0, item as LeaderBoardQueryInputRaw);
    }

    return values;
  }

  public on(event: keyof AchievementServiceEventMap, callback: (eData: AchievementEventData) => void) {
    this.emitter.on(event, callback);
  }

  public off(event: keyof AchievementServiceEventMap, callback: (eData: AchievementEventData) => void) {
    this.emitter.off(event, callback);
  }

  public setMilestoneConfig(milestoneId: number, config: MilestoneConfig): void {
    this.milestoneConfigs.set(milestoneId, config);
  }
}
