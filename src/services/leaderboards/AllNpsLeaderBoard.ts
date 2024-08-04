import {
  BaseLeaderBoard,
  LeaderBoardItem,
  LeaderBoardQueryInputRaw,
} from '@src/services/leaderboards/BaseLeaderBoard';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {QueryTypes} from 'sequelize';
import {buildDynamicCondition} from '@src/utils';

export class AllNpsLeaderBoard extends BaseLeaderBoard {
  async queryData(input: LeaderBoardQueryInputRaw): Promise<LeaderBoardItem[]> {
    const gameIds = input.context?.games || [];
    const taskIds = input.context?.tasks || [];
    const accountId = input.accountId;
    const startTime = input.startTime;
    const endTime = input.endTime;

    // const queryGame = gameIds.length > 0 ? 'AND ta."gameId" IN (:gameIds)' : '';
    // const queryTask = taskIds.length > 0 ? 'AND t."taskId" IN (:taskIds)' : '';
    const queryAccount = accountId ? 'AND "accountId" = :accountId' : '';
    const queryStartTime = startTime ? 'AND "createdAt" >= :startTime' : '';
    const queryEndTime = endTime ? 'AND "createdAt" <= :endTime' : '';

    const queryGame = gameIds.length > 0 ? 'AND "gameId" in (:gameIds)' : '';
    const queryTaskGame = gameIds.length > 0 ? 'AND t."gameId" in (:gameIds)' : '';
    const queryTask = taskIds.length > 0 ? 'AND th."taskId" in (:taskIds)' : '';

    const timeStateMap: Record<string, boolean> = {
      '"createdAt" >= :startDate': !!startTime,
      '"createdAt" <= :endDate': !!endTime,
    };

    const timeCondition = buildDynamicCondition(timeStateMap, 'WHERE');
    
    const directRefCondition = buildDynamicCondition({
      '"sourceAccountId" = :accountId': !!accountId,
      ...timeStateMap,
    }, 'WHERE');

    const indirectRefCondition = buildDynamicCondition({
      '"indirectAccount" = :accountId': !!accountId,
      ...timeStateMap,
    }, 'WHERE');

    const gamePlayCondition = buildDynamicCondition({
      'success IS TRUE': true,
      '"gameId" in (:gameIds)': gameIds?.length > 0,
      '"accountId" = :accountId': !!accountId,
      ...timeStateMap,
    }, 'WHERE');

    const taskCondition = buildDynamicCondition({
      '(th."extrinsicHash" IS NOT NULL AND th.status != \'failed\') OR th."extrinsicHash" IS NULL)': true,
      't."gameId" in (:gameIds)': gameIds?.length > 0,
      'h."taskId" in (:taskIds)': gameIds?.length > 0,
      'th."accountId" = :accountId': !!accountId,
      ...timeStateMap,
    }, 'WHERE');

    const airdropCondition = buildDynamicCondition({
      'arl.type = \'NPS\' AND arl.status = \'RECEIVED\'': true,
      'arl."createdAt" >= :startDate': !!startTime,
      'arl."createdAt" <= :endDate': !!endTime,
    }, 'WHERE');

    const sql = `
        with direct_referral AS (SELECT "sourceAccountId"       AS accountId,
                                        MIN("createdAt")        as "createdAt",
                                        SUM(coalesce(point, 0)) AS point
                                 FROM referral_log
                                 ${directRefCondition}
                                 GROUP BY "sourceAccountId"),
             indirect_referral AS (SELECT "indirectAccount"                 AS accountId,
                                          MIN("createdAt")                  as "createdAt",
                                          SUM(coalesce("indirectPoint", 0)) AS point
                                   FROM referral_log
                                   ${indirectRefCondition}
                                   GROUP BY "indirectAccount"),
             direct_referral_upgrade AS (SELECT "sourceAccountId"       AS accountId,
                                                MIN("createdAt")        as "createdAt",
                                                SUM(coalesce(point, 0)) AS point
                                         FROM referral_upgrade_log
                                         ${directRefCondition}
                                         GROUP BY "sourceAccountId"),
             indirect_referral_upgrade AS (SELECT "indirectAccount"                 AS accountId,
                                                  MIN("createdAt")                  as "createdAt",
                                                  SUM(coalesce("indirectPoint", 0)) AS point
                                           FROM referral_upgrade_log
                                           ${indirectRefCondition}
                                           GROUP BY "indirectAccount"),
             game_play_point AS (SELECT "accountId"             AS accountId,
                                        MIN("createdAt")        as "createdAt",
                                        SUM(coalesce(point, 0)) AS point
                                 FROM game_play
                                 ${gamePlayCondition}    
                                 GROUP BY 1),
             giveaway_point AS (SELECT "accountId"             AS accountId,
                                       MIN("createdAt")        as "createdAt",
                                       SUM(coalesce(point, 0)) AS point
                                FROM giveaway_point
                                ${timeCondition}
                                GROUP BY 1),
             task_point AS (SELECT th."accountId"                     AS accountId,
                                   MIN(th."createdAt")                as "createdAt",
                                   SUM(coalesce(th."pointReward", 0)) AS point
                            FROM task_history th
                                   JOIN task t ON th."taskId" = t.id
                            ${taskCondition}
                            GROUP BY 1),
             airdrop_point AS (SELECT arl.account_id       AS "accountId",
                                      MIN(arl."createdAt") AS "createdAt",
                                      SUM(ar.point)        AS point
                               FROM airdrop_record_log arl
                                        JOIN public.airdrop_records ar
                                             ON ar.id = arl.airdrop_record_id
                               ${airdropCondition}
                               GROUP BY 1),

             data_root as (SELECT *
                           FROM direct_referral
                           UNION ALL
                           SELECT *
                           FROM indirect_referral
                           UNION ALL
                           SELECT *
                           FROM direct_referral_upgrade
                           UNION ALL
                           SELECT *
                           FROM indirect_referral_upgrade
                           UNION ALL
                           SELECT *
                           FROM game_play_point
                           UNION ALL
                           SELECT *
                           FROM giveaway_point
                           UNION ALL
                           SELECT *
                           FROM task_point
                           UNION ALL
                           SELECT *
                           FROM airdrop_point),
             final_data as (SELECT accountId,
                                   sum(point)                                                             as point,
                                   RANK() OVER (ORDER BY sum(point) DESC, MIN(data_root."createdAt") asc) AS rank
                            FROM data_root
                                     JOIN account a ON data_root.accountId = a.id
                            WHERE a."isEnabled" = true
                            GROUP BY 1)
        SELECT accountId                as "accountId",
               a."telegramUsername",
               a.address,
               a."firstName",
               a."lastName",
               a."photoUrl"             as avatar,
               (accountId = :accountId) as mine,
               point,
               rank
        FROM final_data r
                 JOIN account a ON r.accountId = a.id
        WHERE rank <= :limit
           or accountId = :accountId
        order by rank asc`;

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
