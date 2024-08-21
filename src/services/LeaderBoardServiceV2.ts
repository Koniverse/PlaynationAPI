import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import {LeaderboardItem} from '@src/types';
import {KeyValueStoreService} from '@src/services/KeyValueStoreService';
import {calculateStartAndEnd} from '@src/utils/date';
import {
  BaseLeaderBoard,
  LeaderboardContext,
  LeaderBoardQueryInputRaw, LeaderboardType,
} from '@src/services/leaderboards/BaseLeaderBoard';
import {GameCasualLeaderBoard} from '@src/services/leaderboards/GameCasualLeaderBoard';
import logger from 'jet-logger';
import {GameFarmingLeaderBoard} from '@src/services/leaderboards/GameFarmingLeaderBoard';
import {ReferralLeaderBoard} from '@src/services/leaderboards/ReferralLeaderBoard';
import {TaskLeaderBoard} from '@src/services/leaderboards/TaskLeaderBoard';
import {AllNpsLeaderBoard} from '@src/services/leaderboards/AllNpsLeaderBoard';


export class LeaderBoardServiceV2 {
  constructor(private sequelizeService: SequelizeService) {
    setInterval(() => {
      this.clearUnusedLeaderBoard();
    }, 10000);
  }
  private leaderboardMap: Record<string, {
    lastUsed: number;
    leaderBoard: BaseLeaderBoard;
  }> = {};

  // Auto clear cache after 10 minutes not used
  clearUnusedLeaderBoard() {
    const currentTime = Date.now();
    const cacheTime = 10 * 60 * 1000;
    Object.keys(this.leaderboardMap).forEach((key) => {
      const leaderBoardInfo = this.leaderboardMap[key];
      if (currentTime - leaderBoardInfo.lastUsed > cacheTime) {
        delete this.leaderboardMap[key];
      }
    });
  }



  async getConfig(){
    const leaderboard_map = await KeyValueStoreService.instance.get('leaderboard_map') as unknown as LeaderboardItem[];
    const leaderboard_general = await KeyValueStoreService.instance.get('leaderboard_general');
    return {leaderboard_map, leaderboard_general};
  }

  async fetchData(accountId: number, id: number, context: LeaderboardContext = {}, limit = 100){
    const leaderboardList = await KeyValueStoreService.instance.get('leaderboard_map') as unknown as LeaderboardItem[];
    const leaderboard = leaderboardList.find(item => item.id === id);
    if (leaderboard){
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

      return await this.getLeaderBoardData(accountId, {
        type: type as LeaderboardType,
        startTime,
        endTime,
        gameIds,
        taskIds,
        limit,
        metadata,
      });
    }
  }


  async getLeaderBoardData(accountId: number, input: LeaderBoardQueryInputRaw) {
    console.log('getLeaderBoardData', input)
    const key = BaseLeaderBoard.getKey(input);

    let leaderBoardInfo = this.leaderboardMap[key];
    if (!leaderBoardInfo) {
      logger.info(`Create new leader board with key: ${key}`);
      let leaderBoard: BaseLeaderBoard | undefined;
      if (input.type.startsWith('game:casual')) {
        leaderBoard = new GameCasualLeaderBoard(input);
      } else if (input.type.startsWith('game:farming')) {
        leaderBoard = new GameFarmingLeaderBoard(input);
      } else if (input.type.startsWith('referral')) {
        leaderBoard = new ReferralLeaderBoard(input);
      } else if (input.type.startsWith('task')) {
        leaderBoard = new TaskLeaderBoard(input);
      } else if (input.type === LeaderboardType.ALL_NPS) {
        leaderBoard = new AllNpsLeaderBoard(input);
      }

      if (leaderBoard) {
        leaderBoardInfo = {
          lastUsed: Date.now(),
          leaderBoard: leaderBoard,
        };

        this.leaderboardMap[key] = leaderBoardInfo;
      }
    }

    if (!leaderBoardInfo) {
      return [];
    }

    // set last used
    leaderBoardInfo.lastUsed = Date.now();
    return await leaderBoardInfo.leaderBoard.fetchLeaderBoard(accountId, input.limit ?? 100);
  }

  // Singleton
  private static _instance: LeaderBoardServiceV2;
  public static get instance() {
    if (!LeaderBoardServiceV2._instance) {
      LeaderBoardServiceV2._instance = new LeaderBoardServiceV2(SequelizeServiceImpl);
    }
    return LeaderBoardServiceV2._instance;
  }
}
