import {createPromise, PromiseObject} from '@src/utils';

export interface LeaderboardContext {
    games?: number[];
    tasks?: number[];
}

export interface LeaderBoardQueryInputRaw {
  startTime?: Date;
  endTime?: Date;
  context?: LeaderboardContext;
  limit?: number;
  accountId?: number;
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
  protected fullLeaderBoardCacheHandler : PromiseObject<LeaderBoardItem[]> | undefined;
  protected fullLeaderBoardMap: Record<number, LeaderBoardItem> = {};

  abstract queryData(input: LeaderBoardQueryInputRaw) : Promise<LeaderBoardItem[]>;

  constructor(protected input: LeaderBoardQueryInputRaw) {

  }

  public static getKey(input: LeaderBoardQueryInputRaw) {
    return JSON.stringify(input); // Maybe implement a better hashing function
  }

  protected async getTopLeaderboard() : Promise<LeaderBoardItem[]> {
    const data = this.getFullLeaderboard();

    // Return top leaderboard records
    const limit = Math.min(this.topRefresh, this.leaderBoardLength);
    return (await data).slice(0, limit);
  }

  async getAccountData(accountId: number): Promise<LeaderBoardItem | undefined> {
    return (await this.queryData({...this.input, limit: 1, accountId}))[0];
  }

  async getDisplayLeaderboard() : Promise<LeaderBoardItem[]> {
    const data = this.getFullLeaderboard();

    // Return top leaderboard records
    const limit = Math.min(this.topDisplay, this.leaderBoardLength);
    return (await data).slice(0, limit);
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
  async getLeaderBoardData(accountId: number) : Promise<LeaderBoardItem[]> {
    // Get current user's leaderboard record
    const accountData = await this.getAccountData(accountId);
    const topLeaderboard = await this.getTopLeaderboard();
    const topDisplay = await this.getDisplayLeaderboard();

    const topRefreshMinPoint = topLeaderboard[topLeaderboard.length - 1]?.point || 0;
    const topDisplayMinPoint = topLeaderboard[topDisplay.length - 1]?.point || 0;

    // Get top leaderboard records
    // Return top leaderboard records with user's record
    if (!accountData) {
      return topDisplay;
    }

    const accountPoint = accountData?.point;
    accountData.mine = true;

    // Check if user's record is in topDisplay
    if (accountPoint >= topDisplayMinPoint) {
      const topDisplayRs = deepCopy(topDisplay);
      const resultList: LeaderBoardItem[] = [];

      let isInserted = false;
      for (let i = 0; i < topDisplayRs.length; i++) {
        const item = topDisplayRs[i];

        // Skip user's record
        if (item.accountId === accountData.accountId) {
          continue;
        }

        // Insert user's record if it's higher than current record
        if (item.point < accountPoint && !isInserted) {
          accountData.rank = i + 1;
          resultList.push(accountData);
          isInserted = true;
        }

        // Update rank for records after user's record
        if (isInserted) {
          item.rank = i + 2;
        }

        // Add record to result list
        resultList.push(item);
      }

      return resultList;
    } else if (accountPoint >= topRefreshMinPoint) {
      accountData.rank = topLeaderboard.findIndex((item) => item.point < accountPoint) + 1;

      return [...topDisplay, accountData];
    } else {
      // Get full leaderboard
      const currentRankInBoard = this.fullLeaderBoardMap[accountData.accountId];
      accountData.rank = currentRankInBoard?.rank || this.leaderBoardLength + 1;

      return [...topDisplay, accountData];
    }
  }

  async fetchLeaderBoard(accountId: number) : Promise<LeaderBoardOutput[]> {
    const data = await this.getLeaderBoardData(accountId);
    return this.processOutput(data);
  }
}