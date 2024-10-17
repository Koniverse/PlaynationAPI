import {LeaderBoardQueryInputRaw, LeaderboardType} from '@src/services/leaderboards/BaseLeaderBoard';
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
    const r1 = await leaderBoardService.getLeaderBoardData(120306,leaderBoardInfo);
    r1.forEach((r) => {
      // @ts-ignore
      r.accId = r.accountInfo.id;
    });
    console.table(r1);

    console.timeEnd('leaderBoardService.firstLeaderBoard');
    console.time('leaderBoardService.nextMoreLeaderBoard');
    await leaderBoardService.getLeaderBoardData(12,leaderBoardInfo);
    await leaderBoardService.getLeaderBoardData(18,leaderBoardInfo);
    await leaderBoardService.getLeaderBoardData(34,leaderBoardInfo);
    await leaderBoardService.getLeaderBoardData(45,leaderBoardInfo);
    await leaderBoardService.getLeaderBoardData(2390,leaderBoardInfo);
    await leaderBoardService.getLeaderBoardData(25601,leaderBoardInfo);
    console.timeEnd('leaderBoardService.nextMoreLeaderBoard');

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
  it('Check offset Leaderboard', async function () {
    //Backup data production in test
    const leaderBoardInfo = {
      type: LeaderboardType.ALL_NPS,
      startTime: '2024-07-10T10:00:00.000Z',
      endTime: '2024-08-05T03:00:00.000Z',
      gameIds: [],
      taskIds: [],
      limit: 100,
      metadata: null,
    } as unknown as LeaderBoardQueryInputRaw;
    const userIdRank_54 = 111210;

    const leaderBoardRank54 = await leaderBoardService.getLeaderBoardData(userIdRank_54,leaderBoardInfo);

    console.log('data rank 54 length', leaderBoardRank54.length);

    const userIdRank_85 = 153230;
    const leaderBoardRank85 = await leaderBoardService.getLeaderBoardData(userIdRank_85,leaderBoardInfo);
    console.log('data rank 85 length', leaderBoardRank85.length);
    const userEndRank85 = leaderBoardRank85[leaderBoardRank85.length - 1];
    if (userEndRank85){
      expect(userEndRank85.rank).toEqual(105);
      console.log('User end rank 85 is 105');
    }

    const userIdRank_116 = 125826;
    const leaderBoardRank116 = await leaderBoardService.getLeaderBoardData(userIdRank_116,leaderBoardInfo);
    console.log('data rank 116 length', leaderBoardRank116.length);
    const userEndRank116 = leaderBoardRank116[leaderBoardRank116.length - 1];
    if (userEndRank116){
      expect(userEndRank116.rank).toEqual(136);
      console.log('User end rank 116 is 136');
    }

    const userIdRank_131 = 145795;
    const leaderBoardRank131 = await leaderBoardService.getLeaderBoardData(userIdRank_131,leaderBoardInfo);
    const userEndRank131 = leaderBoardRank131[leaderBoardRank131.length - 1];
    const boardRank131ElementTop100 = leaderBoardRank131[99];
    const userStartOffset_131 = leaderBoardRank131[100];
    if (userEndRank131){
      expect(boardRank131ElementTop100.rank).toEqual(100);
      expect(userStartOffset_131.rank).toEqual(111);
      expect(userEndRank131.rank).toEqual(151);
      console.log('User end rank 131 is 111 and 151');
    }

    const userIdRank_38426 = 193958;
    const leaderBoardRank38426 = await leaderBoardService.getLeaderBoardData(userIdRank_38426,leaderBoardInfo);
    const userEndRank38426 = leaderBoardRank38426[leaderBoardRank38426.length - 1];
    const boardRank38426ElementTop100 = leaderBoardRank38426[99];
    const userStartOffset_38426 = leaderBoardRank38426[100];
    if (userEndRank38426){
      expect(boardRank38426ElementTop100.rank).toEqual(100);
      expect(userStartOffset_38426.rank).toEqual(38406);
      expect(userEndRank38426.rank).toEqual(38446);
      console.log('User end rank 38426 is 38406 and 38446');
    }

  });
});
