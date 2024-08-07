import {
  BaseLeaderBoard,
  LeaderBoardItem,
  LeaderBoardQueryInputRaw,
  LeaderboardType,
} from '@src/services/leaderboards/BaseLeaderBoard';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {QueryTypes} from 'sequelize';
import {buildDynamicCondition} from '@src/utils';

export class GameFarmingLeaderBoard extends BaseLeaderBoard {
  async queryData(input: LeaderBoardQueryInputRaw): Promise<LeaderBoardItem[]> {
    const {type, gameIds, taskIds, accountId, startTime, endTime} = input;

    const filterByGameIds = !!gameIds && gameIds?.length > 0;
    const conditionQuery = buildDynamicCondition({
      'a."isEnabled" IS TRUE': true,
      'gp.state IS NOT NULL': true,
      'gp."gameId" IN (:gameIds)': filterByGameIds,
      'gp."accountId" = :accountId': !!accountId,
      'gp."createdAt" >= :startTime': !!startTime,
      'gp."createdAt" <= :endTime': !!endTime,
    }, 'WHERE');

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
            coalesce(CAST(gp."stateData" -> '${field}' AS NUMERIC), 0) AS point,
            gp."createdAt",
            ROW_NUMBER() OVER (PARTITION BY gp."accountId" ORDER BY gp."updatedAt" DESC) AS rn
        FROM
            game_play gp
            JOIN account a ON gp."accountId" = a.id
        ${conditionQuery}
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
          RANK() OVER (ORDER BY point DESC, "accountId" ASC)::INTEGER AS rank
      FROM
          LastGamePlay
      WHERE
          rn = 1
      ORDER BY rank ASC`;

    const result = await SequelizeServiceImpl.sequelize.query<LeaderBoardItem>(sql, {
      type: QueryTypes.SELECT,
      replacements: {
        gameIds: gameIds,
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
