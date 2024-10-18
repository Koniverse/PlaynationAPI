import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import Account from '@src/models/Account';
import EnvVars from '@src/constants/EnvVars';
import {InitNps} from '@src/models';
import {GRPCService} from '@src/services/GRPCService';
import {calculateDaysBetween} from '@src/utils/date';
import {AccountService} from '@src/services/AccountService';

export interface AccountCheckJoinGroupResponse {
  telegramId: number;
  groupId: number;
  messageCount: number;
  timeSinceJoin: Date;
  success: boolean;
}
const grpcService = GRPCService.instance;

export class InitNpsService {
  constructor(private sequelizeService: SequelizeService) {}

  public async getInitNpsByAccount(accountId: number) {
    return InitNps.findAll({
      where: {
        accountId,
      },
    });
  }

  // Add point to account when user create account isPremium and return point added
  public async addPointUserPremium(accountId: number) {
    const account = await Account.findByPk(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    const point = EnvVars.Telegram.PremiumBonusPoint;
    const note = `Premium reward: ${point} points`;
    await AccountService.instance.addAccountPoint(accountId, point);
    await InitNps.create({
      accountId,
      point,
      note,
      metadata: [],
    });

    return point;
  }

  // Add point to account when user join group when create account and return point added
  public async addPointUserJoinGroup(accountId: number, telegramId: number) {
    const groupConfigs = EnvVars.TelegramGroup.Config;
    const groups = groupConfigs.map((group) => group.groupId);
    const account = await Account.findByPk(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    if (groups.length === 0) {
      return 0;
    }

    const groupMap = await this.checkJoinGroup(groups, telegramId);
    if (Object.keys(groupMap).length === 0) {
      return 0;
    }

    let point = 0;
    // For each group, calculate point
    for (const item of groupConfigs) {
      // messagePoint, dayPoint used to calculate point with messageCount and dayCount
      const {groupId, messagePoint, dayPoint} = item;
      const groupData = groupMap[groupId] || null;
      if (groupData) {
        const {timeSinceJoin, messageCount} = groupData;
        let dayCount = 0;
        if (timeSinceJoin) {
          dayCount = calculateDaysBetween(timeSinceJoin);
        }
        point += messageCount * messagePoint + dayCount * dayPoint;
      }
    }

    const note = `Join group reward: ${point} points`;
    await AccountService.instance.addAccountPoint(accountId, point);
    await InitNps.create({
      accountId,
      point,
      note,
      metadata: Object.values(groupMap),
    });

    return point;
  }

  // Check user join group, can be used for task, login, ...
  // Return map of groupId and AccountCheckJoinGroupResponse
  public async checkJoinGroup(groupIds: number[], telegramId: number) {
    // Add promise to check user join group
    const promises = groupIds.map((groupId) => {
      return grpcService.checkUserStateInGroup(telegramId, groupId);
    });

    // Get result from promise and map to groupId
    const results = (await Promise.all(promises)) as unknown as AccountCheckJoinGroupResponse[];
    const dataMap: Record<number, AccountCheckJoinGroupResponse> = {};
    results.forEach((item) => {
      if (item.success) {
        dataMap[item.groupId] = item;
      }
    });

    return dataMap;
  }

  // Singleton this class
  private static _instance: InitNpsService;
  public static get instance() {
    if (!this._instance) {
      this._instance = new InitNpsService(SequelizeServiceImpl);
    }

    return this._instance;
  }
}
