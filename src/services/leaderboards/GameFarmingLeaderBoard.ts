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
    const {type, gameIds, taskIds, accountId, startTime, endTime, metadata} = input;

    const checkNewPlayer = metadata?.newPlayer || false;
    

    const filterByGameIds = !!gameIds && gameIds?.length > 0;
    const conditionQuery = buildDynamicCondition({
      'gp.state IS NOT NULL': true,
      'gp."gameId" IN (:gameIds)': filterByGameIds,
      'gp."accountId" = :accountId': !!accountId,
      'gp."createdAt" >= :startTime': !!startTime,
      'gp."createdAt" <= :endTime': !!endTime,
    }, 'WHERE');
    const conditionTotalQuery = buildDynamicCondition({
      'rn=1': true,
      'a."isEnabled" IS TRUE': true,
      'first_created_at >= :startTime': !!startTime && checkNewPlayer,
      'first_created_at <= :endTime': !!endTime && checkNewPlayer,
    }, 'WHERE');

    let field = 'totalLifetimeMoney';
    if (type === LeaderboardType.GAME_FARMING_EARN_SPEED) {
      field = 'coinEarnPerSecond';
    } else if (type === LeaderboardType.GAME_FARMING_POINT) {
      field = 'coin';
    }

    const sql = `
    WITH
        last_game_play AS (
        SELECT
            gp."accountId",
            coalesce(CAST(gp."stateData" -> '${field}' AS NUMERIC), 0) AS point,
            gp."createdAt",
            MIN(gp."createdAt") OVER (PARTITION BY gp."accountId") AS first_created_at,
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
          "photoUrl" AS avatar,
          false as mine,
          point::BIGINT as point,
          RANK() OVER (ORDER BY point DESC, "accountId" ASC)::INTEGER AS rank
      FROM
          last_game_play
      JOIN account a on a.id = last_game_play."accountId"
        ${conditionTotalQuery}
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
