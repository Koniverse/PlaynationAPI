import {createPromise, PromiseObject} from '@src/utils';
import {LeaderboardMetadata} from '@src/types';

export interface LeaderboardContext {
    games?: number[];
    tasks?: number[];
}

export enum LeaderboardType {
  ALL_NPS = 'all:nps',
  GAME_CASUAL_NPS = 'game:casual:nps',
  GAME_CASUAL_POINT = 'game:casual:point',
  GAME_CASUAL_QUANTITY = 'game:casual:quantity',
  GAME_FARMING_POINT = 'game:farming:point',
  GAME_FARMING_TOTAL_POINT = 'game:farming:totalPoint',
  GAME_FARMING_EARN_SPEED = 'game:farming:earnSpeed',
  REFERRAL_NPS = 'referral:nps',
  REFERRAL_QUANTITY = 'referral:quantity',
  REFERRAL_INVITE_TO_PLAY_NPS = 'referral:inviteToPlay:nps',
  REFERRAL_INVITE_TO_PLAY_QUANTITY = 'referral:inviteToPlay:quantity',
  TASK_NPS = 'task:nps',
  TASK_QUANTITY = 'task:quantity',
  SUMMARY_NPS = 'all:nps',
}

export interface LeaderBoardQueryInputRaw {
  type: LeaderboardType;
  startTime?: Date | string;
  endTime?: Date | string;
  gameIds?: number[];
  taskIds?: number[];
  limit?: number;
  accountId?: number;
  metadata?: LeaderboardMetadata;
}

export interface LeaderBoardItem {
  rank: number;
  accountId: number;
  address: string;
  firstName: string;
  lastName: string;
  point: number;
  telegramUsername: string;
  avatar: string;
  mine: boolean;
}

export interface LeaderBoardOutput {
  rank: number;
  point: number;
  mine: boolean;
  accountInfo: {
    id: number;
    address: string;
    firstName: string;
    lastName: string;
    telegramUsername: string;
    avatar: string;
  }
}

export interface LeaderBoardItemRs {
  rank: number;
  accountId: number;
  address: string;
  firstName: string;
  lastName: string;
  point: number;
  telegramUsername: string;
  avatar: string;
  mine: boolean;
}

function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export abstract class BaseLeaderBoard {
  protected topDisplay = 100;
  protected topRefresh = 500;
  protected leaderBoardLength = 1000;
  protected cacheTime = 30000;
  protected rankOffset = 20;
  protected fullLeaderBoardCacheHandler : PromiseObject<LeaderBoardItem[]> | undefined;
  protected fullLeaderBoardMap: Record<number, LeaderBoardItem> = {};

  abstract queryData(input: LeaderBoardQueryInputRaw) : Promise<LeaderBoardItem[]>;

  constructor(protected input: LeaderBoardQueryInputRaw) {

  }

  public static getKey({type, startTime, endTime, gameIds, taskIds, metadata}: LeaderBoardQueryInputRaw) {
    return `${type}|${String(startTime||'')}|${String(endTime||'')}|${gameIds?.join(',')||''}|${taskIds?.join(',')||''}|${JSON.stringify(metadata ?? {})}`;
  }

  async getDisplayLeaderboard(limit: number) : Promise<LeaderBoardItem[]> {
    const data = this.getFullLeaderboard();

    // Return top leaderboard records
    const top = Math.min(Math.max(this.topDisplay, limit), this.leaderBoardLength);
    return (await data).slice(0, top);
  }

  protected async getTopLeaderboard() : Promise<LeaderBoardItem[]> {
    const data = this.getFullLeaderboard();
    // Return top leaderboard records
    // const top = Math.min(Math.max(this.topRefresh, limit), this.leaderBoardLength);
    //Get all data leader board
    return await data;
  }

  async getAccountData(accountId: number): Promise<LeaderBoardItem | undefined> {
    return (await this.queryData({...this.input, limit: 1, accountId}))[0];
  }

  async getFullLeaderboard() {
    if (!this.fullLeaderBoardCacheHandler) {
      const handler = createPromise<LeaderBoardItem[]>();
      this.fullLeaderBoardCacheHandler = handler;
      // Process caching
      this.queryData({...this.input, limit: undefined})
        .then((rs) => {
          handler.resolve(rs);
          this.leaderBoardLength = rs.length;
          this.fullLeaderBoardMap = Object.fromEntries(rs.map((item) => [item.accountId, item]));
        })
        .catch(this.fullLeaderBoardCacheHandler.reject);

      setTimeout(() => {
        this.fullLeaderBoardCacheHandler = undefined;
      }, this.cacheTime);
    }

    return await this.fullLeaderBoardCacheHandler.promise;
  }
  
  processOutput(data: LeaderBoardItem[]): LeaderBoardOutput[] {
    return data.map((item) => {
      return {
        rank: item.rank,
        point: item.point,
        mine: item.mine,
        accountInfo: {
          id: item.accountId,
          address: item.address,
          firstName: item.firstName,
          lastName: item.lastName,
          telegramUsername: item.telegramUsername,
          avatar: item.avatar,
        },
      };
    });
  }

  /**
   * Get leaderboard data for current user
   * */
  async getLeaderBoardData(accountId: number, limit=100) : Promise<LeaderBoardItem[]> {
    // Get current user's leaderboard record
    const accountData = await this.getAccountData(accountId);
    const topLeaderboard = await this.getTopLeaderboard();
    const topDisplay = await this.getDisplayLeaderboard(limit);

    const topRefreshMinPoint = topLeaderboard[topLeaderboard.length - 1]?.point || 0;
    const topDisplayMinPoint = topLeaderboard[topDisplay.length - 1]?.point || 0;

    // Get top leaderboard records
    // Return top leaderboard records with user's record
    if (!accountData) {
      return topDisplay;
    }

    const accountPoint = accountData?.point;
    accountData.mine = true;
    let currentRank = 0;

    // Check if user's record is in topDisplay
    if (accountPoint >= topDisplayMinPoint) {
      const topDisplayRs = deepCopy(topDisplay);
      const resultListOffset = topLeaderboard.slice(limit+1, limit + this.rankOffset);

      // Just update mine record if it's point is not changed
      const currentRecord = this.fullLeaderBoardMap[accountData.accountId];
      if (currentRecord.point === accountPoint) {
        topDisplayRs.forEach((item, index) => {
          if (item.accountId === accountData.accountId) {
            item.mine = true;
            currentRank = index + 1;
          }
        });
        if (currentRank <= (limit - this.rankOffset)) {
          return topDisplayRs;
        }

        return [...topDisplayRs, ...resultListOffset];
      }

      const resultList = topDisplayRs.filter((item) => item.accountId !== accountData.accountId);
      resultList.push(accountData);
      resultList.sort((a, b) => b.point - a.point);
      resultList.forEach((item, index) => {
        item.rank = index + 1;
        if (item.accountId === accountData.accountId) {
          currentRank = index + 1;
        }
      }, 0);

      if (currentRank <= (limit - this.rankOffset)) {
        return resultList;
      }

      return [...resultList, ...resultListOffset];
    }else {
      // Find user's rank in top leaderboard a
      accountData.rank = topLeaderboard.findIndex((item) => item.point <= accountPoint && item.accountId === accountData.accountId) + 1;

      const currentRank = accountData.rank;
      // Add user's record to top leaderboard +- 20 from current rank
      const resultList = this.getLeaderBoardRankOffsetList(currentRank, accountData, topLeaderboard, limit);
      return [...topDisplay, ...resultList];
    }
  }
  
  getLeaderBoardRankOffsetList(currentRank: number, accountData: LeaderBoardItem, topLeaderboard: LeaderBoardItem[], limit: number) {
    const start = Math.max(currentRank - this.rankOffset - 1, limit);
    const end = Math.min(accountData.rank + this.rankOffset, this.leaderBoardLength);
    const resultList = topLeaderboard.slice(start, end).filter((item) => item.accountId !== accountData.accountId);
    resultList.push(accountData);
    resultList.sort((a, b) => b.point - a.point);
    resultList.forEach((item) => {
      if (item.accountId === accountData.accountId) {
        item.mine = true;
      }
    });
    return resultList;
  }

  async fetchLeaderBoard(accountId: number, limit = 100) : Promise<LeaderBoardOutput[]> {
    const data = await this.getLeaderBoardData(accountId, limit);
    return this.processOutput(data);
  }
}
