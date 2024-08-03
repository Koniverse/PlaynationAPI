import {
  BaseLeaderBoard,
  LeaderBoardItem,
  LeaderBoardQueryInputRaw,
  LeaderboardType,
} from '@src/services/leaderboards/BaseLeaderBoard';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {QueryTypes} from 'sequelize';

export class GameFarmingLeaderBoard extends BaseLeaderBoard {
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

    let field = 'totalLifetimeMoney';
    if (type === LeaderboardType.GAME_FARMING_EARN_SPEED) {
      field = 'coinEarnPerSecond';
    } else if (type === LeaderboardType.GAME_FARMING_POINT) {
      field = 'coin';
    }

    const sql = `
    WITH LastGamePlay AS (
        SELECT
            gp."accountId",
            a."telegramUsername",
            a.address,
            a."firstName",
            a."lastName",
            a."photoUrl" AS avatar,
            coalesce(CAST(gp."stateData" -> '${field}' AS NUMERIC), 0) point,
            gp."createdAt",
            ROW_NUMBER() OVER (PARTITION BY gp."accountId" ORDER BY gp."createdAt" DESC) AS rn
        FROM
            game_play gp
            JOIN account a ON gp."accountId" = a.id
        WHERE gp.success IS TRUE
            AND a."isEnabled" IS TRUE
            ${queryGame}
            ${queryAccount}
            ${queryStartTime}
            ${queryEndTime}
    )
      SELECT
          "accountId",
          "telegramUsername",
          address,
          "firstName",
          "lastName",
          avatar,
          false as mine,
          point::BIGINT as point,
          RANK() OVER (ORDER BY point DESC, "createdAt" ASC)::INTEGER AS rank
      FROM
          LastGamePlay
      WHERE
          rn = 1
      ORDER BY rank ASC`;

    const result = await SequelizeServiceImpl.sequelize.query<LeaderBoardItem>(sql, {
      type: QueryTypes.SELECT,
      replacements: {
        gameIds: gameIds.join(','),
        accountId,
        startTime,
        endTime,
      },
    });

    result.forEach((item) => {
      // @ts-ignore
      item.point = parseInt(item.point);
    });

    return result;
  }
}