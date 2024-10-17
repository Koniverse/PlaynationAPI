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
    const {type, gameIds, taskIds, accountIds, startTime, endTime, metadata} = input;

    const checkNewPlayer = metadata?.newPlayer || false;
    const filterByGameIds = !!gameIds && gameIds?.length > 0;
    const filterByAccountIds = !!accountIds && accountIds?.length > 0;
    const conditionFirstQuery = buildDynamicCondition({
      'gp.state IS NOT NULL': true,
      'gp."accountId" IN (:accountIds)': filterByAccountIds,
      'gp."gameId" IN (:gameIds)': filterByGameIds,
    }, 'WHERE');
    const conditionQuery = buildDynamicCondition({
      'gp.state IS NOT NULL': true,
      'gp."gameId" IN (:gameIds)': filterByGameIds,
      'gp."accountId" IN (:accountIds)': filterByAccountIds,
      'gp."createdAt" >= :startTime': !!startTime,
      'gp."createdAt" <= :endTime': !!endTime,
    }, 'WHERE');
    const conditionTotalQuery = buildDynamicCondition({
      'rn=1': true,
      'a."isEnabled" IS TRUE': true,
      'fp.first_created_at >= :startTime': !!startTime && checkNewPlayer,
      'fp.first_created_at <= :endTime': !!endTime && checkNewPlayer,
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
            ROW_NUMBER() OVER (PARTITION BY gp."accountId" ORDER BY gp."updatedAt" DESC) AS rn
        FROM
            game_play gp
        ${conditionQuery}
    ), first_game_play AS (SELECT gp."accountId",
                                MIN(gp."createdAt") AS first_created_at
                         FROM game_play gp
                         ${conditionFirstQuery}
                         group by 1)
      SELECT
          lp."accountId",
          "telegramUsername",
          address,
          "firstName",
          "lastName",
          "photoUrl" AS avatar,
          false as mine,
          point::BIGINT as point,
          RANK() OVER (ORDER BY point DESC, lp."accountId" ASC)::INTEGER AS rank
      FROM last_game_play lp
            JOIN first_game_play fp on lp."accountId" = fp."accountId"
         JOIN account a on a.id = lp."accountId"
        ${conditionTotalQuery}
      ORDER BY rank ASC`;

    const result = await SequelizeServiceImpl.sequelize.query<LeaderBoardItem>(sql, {
      type: QueryTypes.SELECT,
      replacements: {
        gameIds: gameIds,
        accountIds,
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
