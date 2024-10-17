import {
  BaseLeaderBoard,
  LeaderBoardItem,
  LeaderBoardQueryInputRaw,
  LeaderboardType,
} from '@src/services/leaderboards/BaseLeaderBoard';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {QueryTypes} from 'sequelize';
import {buildDynamicCondition} from '@src/utils';

export class GameCasualLeaderBoard extends BaseLeaderBoard {
  async queryData(input: LeaderBoardQueryInputRaw): Promise<LeaderBoardItem[]> {
    const {type, gameIds, taskIds, accountIds, startTime, endTime} = input;

    const filterByGameIds = !!gameIds && gameIds?.length > 0;
    const filterByAccountIds = !!accountIds && accountIds?.length > 0;
    const conditionQuery = buildDynamicCondition({
      'a."isEnabled" IS TRUE': true,
      'gp.success IS TRUE': true,
      'gp."gameId" IN (:gameIds)': filterByGameIds,
      'gp."accountId" IN (:accountIds)': filterByAccountIds,
      'gp."createdAt" >= :startTime': !!startTime,
      'gp."createdAt" <= :endTime': !!endTime,
    }, 'WHERE');

    let pointQuery = 'SUM(coalesce(gp.point, 0))';
    if (type === LeaderboardType.GAME_CASUAL_POINT) {
      pointQuery = 'SUM(coalesce(gp."gamePoint", 0))';
    }
    if (type === LeaderboardType.GAME_CASUAL_QUANTITY) {
      pointQuery = 'count(gp.id)';
    }

    const sql = `
SELECT gp."accountId",
    a."telegramUsername",
    a.address,
    a."firstName",
    a."lastName",
    a."photoUrl"                                           as avatar,
    false as mine,
    ${pointQuery}::int                             AS point,
    RANK() OVER (ORDER BY ${pointQuery} DESC, MIN(gp."createdAt") asc)::int as rank
FROM game_play gp
    JOIN account a ON gp."accountId" = a.id
${conditionQuery}
GROUP BY 1, 2, 3, 4, 5, 6
ORDER BY rank asc`;

    const result = await SequelizeServiceImpl.sequelize.query<LeaderBoardItem>(sql, {
      type: QueryTypes.SELECT,
      replacements: {
        gameIds: gameIds,
        accountIds,
        startTime,
        endTime,
      },
    });

    return result;
  }
}
