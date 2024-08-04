import {
  BaseLeaderBoard,
  LeaderBoardItem,
  LeaderBoardQueryInputRaw,
} from '@src/services/leaderboards/BaseLeaderBoard';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {QueryTypes} from 'sequelize';

export class SummaryLeaderBoard extends BaseLeaderBoard {
  async queryData(input: LeaderBoardQueryInputRaw): Promise<LeaderBoardItem[]> {
    const {gameIds, taskIds, accountId, startTime, endTime} = input;

    const queryGame = (gameIds && gameIds.length > 0) ? 'AND "gameId" IN (:gameIds)' : '';
    const queryTaskGame = (gameIds && gameIds.length > 0) ? 'AND t."gameId" IN (:gameIds)' : '';
    const queryTask = (taskIds && taskIds.length > 0) ? 'AND th."taskId" IN (:taskIds)' : '';
    const querySourceAccountId = accountId ? 'AND "sourceAccountId" = :accountId' : '';
    const queryAccount = accountId ? 'AND "accountId" = :accountId' : '';
    const queryIndirectAccount = accountId ? 'AND "indirectAccount" = :accountId' : '';
    const queryStartTime = startTime ? 'AND "createdAt" >= :startTime' : '';
    const queryEndTime = endTime ? 'AND "createdAt" <= :endTime' : '';
    const queryTaskHistoryStartTime = startTime ? 'AND th."createdAt" >= :startTime' : '';
    const queryTaskHistoryEndTime = endTime ? 'AND th."createdAt" <= :endTime' : '';
    const queryTaskHistoryAccount = accountId ? 'AND th."accountId" = :accountId' : '';
    const queryArlStartTime = startTime ? 'AND arl."createdAt" >= :startTime' : '';
    const queryArlEndTime = endTime ? 'AND arl."createdAt" <= :endTime' : '';
    const queryArlAccount = accountId ? 'AND arl.account_id = :accountId' : '';

    const sql = `
    
        with RankedUsers as (SELECT "sourceAccountId"       AS accountId,
                                    MIN("createdAt")        as "createdAt",
                                    SUM(coalesce(point, 0)) AS point
                             FROM referral_log
                             where 1 = 1 ${queryStartTime} ${queryEndTime} ${querySourceAccountId}
                             GROUP BY "sourceAccountId"
                             UNION ALL
                             SELECT "indirectAccount"                 AS accountId,
                                    MIN("createdAt")                  as "createdAt",
                                    SUM(coalesce("indirectPoint", 0)) AS point
                             FROM referral_log
                             where 1 = 1 ${queryStartTime} ${queryEndTime} ${queryIndirectAccount}
                             GROUP BY "indirectAccount"

                             UNION ALL
                             SELECT "sourceAccountId"       AS accountId,
                                    MIN("createdAt")        as "createdAt",
                                    SUM(coalesce(point, 0)) AS point
                             FROM referral_upgrade_log
                             where 1 = 1 ${queryStartTime} ${queryEndTime} ${querySourceAccountId}
                             GROUP BY "sourceAccountId"
                             UNION ALL
                             SELECT "indirectAccount"                 AS accountId,
                                    MIN("createdAt")                  as "createdAt",
                                    SUM(coalesce("indirectPoint", 0)) AS point
                             FROM referral_upgrade_log
                             where 1 = 1 ${queryStartTime} ${queryEndTime} ${queryIndirectAccount}
                             GROUP BY "indirectAccount"

                             UNION ALL
                             SELECT "accountId"             AS accountId,
                                    MIN("createdAt")        as "createdAt",
                                    SUM(coalesce(point, 0)) AS point
                             FROM game_play
                             where success is true
                               ${queryStartTime} ${queryEndTime} ${queryAccount} ${queryGame}
                             GROUP BY 1
                             UNION ALL
                             SELECT "accountId"             AS accountId,
                                    MIN("createdAt")        as "createdAt",
                                    SUM(coalesce(point, 0)) AS point
                             FROM giveaway_point
                             where 1 = 1 ${queryStartTime} ${queryEndTime} ${queryAccount}
                             GROUP BY 1
                             UNION ALL
                             SELECT th."accountId"                     AS accountId,
                                    MIN(th."createdAt")                as "createdAt",
                                    SUM(coalesce(th."pointReward", 0)) AS point
                             FROM task_history th
                             JOIN task t on th."taskId" = t.id
                             where  ((th."extrinsicHash" is not null and th.status != 'failed') 
                                        or th."extrinsicHash" is null)
                               ${queryTaskGame} ${queryTask} ${queryTaskHistoryStartTime} ${queryTaskHistoryEndTime} ${queryTaskHistoryAccount}
                             GROUP BY 1
                               UNION ALL
                     SELECT arl.account_id       AS "accountId",
                            MIN(arl."createdAt") as "createdAt",
                            sum(ar.point)        as point
                     from airdrop_record_log arl
                              JOIN public.airdrop_records ar on ar.id = arl.airdrop_record_id
                     where arl.type = 'NPS'
                       AND arl.status = 'RECEIVED' ${queryArlStartTime} ${queryArlEndTime} ${queryArlAccount}
                     group by 1),
             totalData as (SELECT accountId,
                                  sum(point)                                                   as point,
                                  RANK() OVER (ORDER BY sum(point) DESC, MIN(RankedUsers."createdAt") asc) AS rank
                           FROM RankedUsers
                           JOIN account a ON RankedUsers.accountId = a.id
                                          where a."isEnabled" = true
                           group by 1)
        SELECT accountId                as "accountId",
               a."telegramUsername",
               a.address,
               a."firstName",
               a."lastName",
               a."photoUrl"             as avatar,
               false as mine,
               point,
               rank
        FROM totalData r
                 JOIN account a ON r.accountId = a.id
        order by rank asc;
    `;

    const result = await SequelizeServiceImpl.sequelize.query<LeaderBoardItem>(sql, {
      type: QueryTypes.SELECT,
      replacements: {
        gameIds: gameIds,
        taskIds: taskIds,
        accountId,
        startTime,
        endTime,
      },
    });

    return result;
  }
}
