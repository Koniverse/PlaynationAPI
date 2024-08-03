import {LeaderboardType} from '@src/services/leaderboards/BaseLeaderBoard';
import {LeaderBoardService} from '@src/services/LeaderBoardService';

const leaderBoardService = LeaderBoardService.instance;

describe('LeaderBoard Test', () => {
  it('Check game Leaderboard', async function () {
    const leaderBoardInfo = {
      type: LeaderboardType.GAME_CASUAL_NPS,
      startTime: '2024-07-01',
      endTime: '2024-07-30',
      context: {
        games: [7],
      },
    };
    
    const r1 = await leaderBoardService.getLeaderBoardV2(25601,leaderBoardInfo);
    const r2 = await leaderBoardService.getLeaderBoardV2(25601,leaderBoardInfo);
    const r3 = await leaderBoardService.getLeaderBoardV2(25601,leaderBoardInfo);

    console.table(r1);
  });
});