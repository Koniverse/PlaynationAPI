import {
  BaseLeaderBoard,
  LeaderBoardItem,
  LeaderBoardQueryInputRaw,
  LeaderboardType,
} from '@src/services/leaderboards/BaseLeaderBoard';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {QueryTypes} from 'sequelize';

export class GameCasualLeaderBoard extends BaseLeaderBoard {
  async queryData(input: LeaderBoardQueryInputRaw): Promise<LeaderBoardItem[]> {
    const type = input.type;
    const gameIds = input.context?.games || [];
    const accountId = input.accountId;
    const startTime = input.startTime;
    const endTime = input.endTime;

    const queryGame = gameIds.length > 0 ? 'AND gp."gameId" IN (:gameIds)' : '';
    const queryAccount = accountId ? 'AND gp."accountId" = :accountId' : '';
    const queryStartTime = startTime ? 'AND gp."createdAt" >= :startTime' : '';
    const queryEndTime = endTime ? 'AND gp."createdAt" <= :endTime' : '';

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
WHERE gp.success is true AND a."isEnabled" is true ${queryGame} ${queryStartTime} ${queryEndTime} ${queryAccount}
GROUP BY 1, 2, 3, 4, 5, 6
ORDER BY rank asc`;

    const result = await SequelizeServiceImpl.sequelize.query<LeaderBoardItem>(sql, {
      type: QueryTypes.SELECT,
      replacements: {
        gameIds: gameIds,
        accountId,
        startTime,
        endTime,
      },
    });

    return result;
  }
}
