import {
  BaseLeaderBoard,
  LeaderBoardItem,
  LeaderBoardQueryInputRaw,
  LeaderboardType,
} from '@src/services/leaderboards/BaseLeaderBoard';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {QueryTypes} from 'sequelize';
import * as console from 'node:console';

export class ReferralLeaderBoard extends BaseLeaderBoard {
  async queryData(input: LeaderBoardQueryInputRaw): Promise<LeaderBoardItem[]> {
    const type = input.type;
    const gameIds = input.context?.games || [];
    const accountId = input.accountId;
    const startTime = input.startTime;
    const endTime = input.endTime;
    const refLevel = input.metadata?.refLevel || 0;

    const queryGame = gameIds.length > 0 ? 'AND "gameId" IN (:gameIds)' : '';
    const querySourceAccountId = accountId ? 'AND "sourceAccountId" = :accountId' : '';
    const queryAccount = accountId ? 'AND "accountId" = :accountId' : '';
    const queryIndirectAccount = accountId ? 'AND "indirectAccount" = :accountId' : '';
    const queryStartTime = startTime ? 'AND "createdAt" >= :startTime' : '';
    const queryEndTime = endTime ? 'AND "createdAt" <= :endTime' : '';

    let pointQuery = 'SUM(coalesce(point, 0))';
    let indirectPointQuery = 'SUM(coalesce("indirectPoint", 0))';


    let sqlPlayGame = '';
    let queryPlayGame = '';

    if (type.includes('inviteToPlay')) {
      sqlPlayGame = `
      playGamme as (SELECT "accountId"
                   FROM game_play
                   where  1=1 ${queryStartTime} ${queryEndTime} ${queryGame} ${queryAccount}
                   ),
      `;
      queryPlayGame = ' and "invitedAccountId" in (SELECT "accountId" from playGamme)';
    }

    let sqlUpgradeRankSourceAccount = `
      UNION ALL
                                SELECT "sourceAccountId"       AS accountId,
                                       Min("createdAt") as createdAt,
                                       ${pointQuery} AS point
                                FROM referral_upgrade_log
                                where 1=1 ${queryStartTime}
                                  ${queryEndTime} ${queryPlayGame} ${querySourceAccountId}
                                GROUP BY "sourceAccountId"
      `;
    let sqlUpgradeRankIndirectAccount = `
        UNION ALL
                                SELECT "indirectAccount"                 AS accountId,
                                       Min("createdAt") as createdAt,
                                       ${indirectPointQuery} AS point
                                FROM referral_upgrade_log
                                where 1=1 ${queryStartTime}
                                  ${queryEndTime} ${queryPlayGame} ${queryIndirectAccount}
                                GROUP BY "indirectAccount"
      `;
    if (type.endsWith('quantity')) {
      pointQuery = 'count(id)';
      indirectPointQuery = 'count(id)';
      sqlUpgradeRankSourceAccount = '';
      sqlUpgradeRankIndirectAccount = '';
    }


    let queryF1 = `
    SELECT "sourceAccountId"       AS accountId,
                                       Min("createdAt") as createdAt,
                                       ${pointQuery} AS point
                                FROM referral_log
                                where 1=1 ${queryStartTime}
                                  ${queryEndTime} ${queryPlayGame} ${querySourceAccountId}
                                GROUP BY "sourceAccountId"
                                ${sqlUpgradeRankSourceAccount}
    `;
    let queryF2 = `
    SELECT "indirectAccount"                 AS accountId,
                                       Min("createdAt") as createdAt,
                                       ${indirectPointQuery} AS point
                                FROM referral_log
                                where 1=1 ${queryStartTime}
                                  ${queryEndTime} ${queryPlayGame} ${queryIndirectAccount}
                                GROUP BY "indirectAccount"
                                ${sqlUpgradeRankIndirectAccount}
    `;
    const unionAll = refLevel === 0 || refLevel > 2 ? ' UNION ALL ' : '';
    if (refLevel == 1){
      queryF2 = '';
    }
    if (refLevel == 2) {
      queryF1 = '';
    }
    const sql = `
        with 
            ${sqlPlayGame}
            combinedPoints as (
          ${queryF1} ${unionAll} ${queryF2}
                                ),
             rankedUsers as (SELECT accountId,
                                    RANK() OVER (ORDER BY SUM(point) DESC, MIN(combinedPoints.createdAt) asc) as rank,
                                    SUM(point)                             AS point
                             FROM combinedPoints 
                             JOIN account a on a.id = accountId
                             where a."isEnabled"
                             GROUP BY accountId)
        SELECT a.id                as "accountId",
               a."address",
               a."firstName",
               a."lastName",
               a."telegramUsername",
               a."photoUrl"        as avatar,
               ra.rank,
               false as mine,
               ra.point::int            AS point
        FROM rankedUsers ra
                 JOIN account a ON ra.accountId = a.id
        ORDER BY point DESC;
    `;

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
