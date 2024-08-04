import {LeaderboardType} from '@src/services/leaderboards/BaseLeaderBoard';
import * as console from 'node:console';
import {LeaderBoardServiceV2} from '@src/services/LeaderBoardServiceV2';

const leaderBoardService = LeaderBoardServiceV2.instance;

describe('LeaderBoard Test', () => {
  it('Check ALL NPS Leaderboard', async function () {
    const leaderBoardInfo = {
      type: LeaderboardType.ALL_NPS,
      startTime: '2024-07-01',
      endTime: '2024-07-30',
      context: {
        games: [7],
        tasks: [1, 2],
      },
    };

    console.time('leaderBoardService.firstLeaderBoard');
    const r1 = await leaderBoardService.getLeaderBoardData(3,leaderBoardInfo);
    console.timeEnd('leaderBoardService.firstLeaderBoard');
    console.time('leaderBoardService.nextMoreLeaderBoard');
    await leaderBoardService.getLeaderBoardData(12,leaderBoardInfo);
    await leaderBoardService.getLeaderBoardData(18,leaderBoardInfo);
    await leaderBoardService.getLeaderBoardData(34,leaderBoardInfo);
    await leaderBoardService.getLeaderBoardData(45,leaderBoardInfo);
    await leaderBoardService.getLeaderBoardData(2390,leaderBoardInfo);
    await leaderBoardService.getLeaderBoardData(25601,leaderBoardInfo);
    console.timeEnd('leaderBoardService.nextMoreLeaderBoard');

    console.table(r1);
  });
  it('Check game Leaderboard', async function () {
    const leaderBoardInfo = {
      type: LeaderboardType.GAME_CASUAL_POINT,
      context: {
        startTime: '2024-05-01',
        endTime: '2024-07-30',
        games: [1],
      },
    };

    console.time('leaderBoardService.getLeaderBoardData');
    console.time('leaderBoardService.getLeaderBoardData-01');
    const r1 = await leaderBoardService.getLeaderBoardData(25601,leaderBoardInfo);
    console.timeEnd('leaderBoardService.getLeaderBoardData-01');
    const r2 = await leaderBoardService.getLeaderBoardData(25601,leaderBoardInfo);
    const r3 = await leaderBoardService.getLeaderBoardData(25601,leaderBoardInfo);
    console.timeEnd('leaderBoardService.getLeaderBoardData');

    console.table(r1);
  });
  it('Check game farming Leaderboard', async function () {
    const leaderBoardInfo = {
      type: LeaderboardType.GAME_FARMING_POINT,
      context: {
        games: [7],
      },
    };

    console.time('leaderBoardService.getLeaderBoardData');
    console.time('leaderBoardService.getLeaderBoardData-01');
    const r1 = await leaderBoardService.getLeaderBoardData(25601,leaderBoardInfo);
    console.timeEnd('leaderBoardService.getLeaderBoardData-01');
    const r2 = await leaderBoardService.getLeaderBoardData(25601,leaderBoardInfo);
    const r3 = await leaderBoardService.getLeaderBoardData(25601,leaderBoardInfo);
    console.timeEnd('leaderBoardService.getLeaderBoardData');

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

    const r1 = await leaderBoardService.getLeaderBoardData(2,leaderBoardInfo);

    console.table(r1);
    const leaderBoardInfo1 = {
      type: LeaderboardType.TASK_QUANTITY,
      startTime: '2024-07-01',
      endTime: '2024-07-30',
      context: {
      },
    };

    const r2 = await leaderBoardService.getLeaderBoardData(2,leaderBoardInfo1);

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
    const r1 = await leaderBoardService.getLeaderBoardData(3,leaderBoardInfo);
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
    const r2 = await leaderBoardService.getLeaderBoardData(3,leaderBoardInfo1);
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
    const r3 = await leaderBoardService.getLeaderBoardData(3,leaderBoardInfo2);
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
    const r4 = await leaderBoardService.getLeaderBoardData(3,leaderBoardInfo4);
    console.table(r4);
  });
});
