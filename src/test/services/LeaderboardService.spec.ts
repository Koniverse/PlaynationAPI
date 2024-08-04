import {LeaderboardType} from '@src/services/leaderboards/BaseLeaderBoard';
import {LeaderBoardService} from '@src/services/LeaderBoardService';
import * as console from 'node:console';

const leaderBoardService = LeaderBoardService.instance;

describe('LeaderBoard Test', () => {
  it('Check ALL NPS Leaderboard', async function () {
    const leaderBoardInfo = {
      type: LeaderboardType.ALL_NPS,
    };

    console.time('leaderBoardService.firstLeaderBoard');
    const r1 = await leaderBoardService.getLeaderBoardV2(3,leaderBoardInfo);
    console.timeEnd('leaderBoardService.firstLeaderBoard');
    console.time('leaderBoardService.nextMoreLeaderBoard');
    await leaderBoardService.getLeaderBoardV2(12,leaderBoardInfo);
    await leaderBoardService.getLeaderBoardV2(18,leaderBoardInfo);
    await leaderBoardService.getLeaderBoardV2(34,leaderBoardInfo);
    await leaderBoardService.getLeaderBoardV2(45,leaderBoardInfo);
    await leaderBoardService.getLeaderBoardV2(2390,leaderBoardInfo);
    await leaderBoardService.getLeaderBoardV2(25601,leaderBoardInfo);
    console.timeEnd('leaderBoardService.nextMoreLeaderBoard');

    console.table(r1);
  });
  it('Check game Leaderboard', async function () {
    const leaderBoardInfo = {
      type: LeaderboardType.GAME_CASUAL_POINT,
      context: {
        games: [1],
      },
    };

    console.time('leaderBoardService.getLeaderBoardV2');
    console.time('leaderBoardService.getLeaderBoardV2-01');
    const r1 = await leaderBoardService.getLeaderBoardV2(25601,leaderBoardInfo);
    console.timeEnd('leaderBoardService.getLeaderBoardV2-01');
    const r2 = await leaderBoardService.getLeaderBoardV2(25601,leaderBoardInfo);
    const r3 = await leaderBoardService.getLeaderBoardV2(25601,leaderBoardInfo);
    console.timeEnd('leaderBoardService.getLeaderBoardV2');

    console.table(r1);
  });
  it('Check game farming Leaderboard', async function () {
    const leaderBoardInfo = {
      type: LeaderboardType.GAME_FARMING_POINT,
      context: {
        games: [7],
      },
    };

    console.time('leaderBoardService.getLeaderBoardV2');
    console.time('leaderBoardService.getLeaderBoardV2-01');
    const r1 = await leaderBoardService.getLeaderBoardV2(25601,leaderBoardInfo);
    console.timeEnd('leaderBoardService.getLeaderBoardV2-01');
    const r2 = await leaderBoardService.getLeaderBoardV2(25601,leaderBoardInfo);
    const r3 = await leaderBoardService.getLeaderBoardV2(25601,leaderBoardInfo);
    console.timeEnd('leaderBoardService.getLeaderBoardV2');

    console.table(r1);
  });
  it('Check task Leaderboard', async function () {
    const leaderBoardInfo = {
      type: LeaderboardType.TASK_NPS,
      startTime: '2024-07-01',
      endTime: '2024-07-30',
      context: {
        games: [7],
        tasks: [1, 2],
      },
    };

    const r1 = await leaderBoardService.getLeaderBoardV2(2,leaderBoardInfo);

    console.table(r1);
    const leaderBoardInfo1 = {
      type: LeaderboardType.TASK_QUANTITY,
      startTime: '2024-07-01',
      endTime: '2024-07-30',
      context: {
      },
    };

    const r2 = await leaderBoardService.getLeaderBoardV2(2,leaderBoardInfo1);

    console.table(r2);
  });
  it('Check all Leaderboard', async function () {
    const leaderBoardInfo = {
      type: LeaderboardType.SUMMARY_NPS,
      startTime: '2024-07-01',
      endTime: '2024-07-30',
      context: {
        games: [7],
        tasks: [1, 2],
      },
    };

    const r1 = await leaderBoardService.getLeaderBoardV2(2,leaderBoardInfo);

    console.table(r1);
    const leaderBoardInfo1 = {
      type: LeaderboardType.SUMMARY_NPS,
      startTime: '2024-07-01',
      endTime: '2024-07-30',
      context: {
      },
    };

    const r2 = await leaderBoardService.getLeaderBoardV2(2,leaderBoardInfo1);

    console.table(r2);
  });
  it('Check Referral Leaderboard', async function () {
    const leaderBoardInfo = {
      type: LeaderboardType.REFERRAL_NPS,
      startTime: '2024-07-01',
      endTime: '2024-08-30',
      context: {
      },
    };
    console.log('query all');
    const r1 = await leaderBoardService.getLeaderBoardV2(3,leaderBoardInfo);
    console.table(r1);
    const leaderBoardInfo1 = {
      type: LeaderboardType.REFERRAL_QUANTITY,
      startTime: '2024-07-01',
      endTime: '2024-08-30',
      context: {
        games: [7],
      },
    };
    console.log('query game 7');
    const r2 = await leaderBoardService.getLeaderBoardV2(3,leaderBoardInfo1);
    console.table(r2);
    const leaderBoardInfo2 = {
      type: LeaderboardType.REFERRAL_INVITE_TO_PLAY_NPS,
      startTime: '2024-07-01',
      endTime: '2024-08-30',
      metadata: {
        refLevel: 1,
      },
    };
    console.log('query refLevel 1');
    const r3 = await leaderBoardService.getLeaderBoardV2(3,leaderBoardInfo2);
    console.table(r3);
    const leaderBoardInfo4 = {
      type: LeaderboardType.REFERRAL_INVITE_TO_PLAY_QUANTITY,
      startTime: '2024-07-01',
      endTime: '2024-08-30',
      context: {
        games: [7, 5],
      },
      metadata: {
        refLevel: 1,
      },
    };
    console.log('query refLevel 2');
    console.log(leaderBoardInfo4);
    const r4 = await leaderBoardService.getLeaderBoardV2(3,leaderBoardInfo4);
    console.table(r4);
  });
});
