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
    const {gameIds, taskIds, accountId, startTime, endTime} = input;
    const timeStateMap: Record<string, boolean> = {
      '"createdAt" >= :startTime': !!startTime,
      '"createdAt" <= :endTime': !!endTime,
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

    const filerByGameIds = !!gameIds && gameIds?.length > 0;
    const gamePlayCondition = buildDynamicCondition({
      'success IS TRUE': true,
      '"gameId" in (:gameIds)': filerByGameIds,
      '"accountId" = :accountId': !!accountId,
      ...timeStateMap,
    }, 'WHERE');

    const filterByTaskIds = !!taskIds && taskIds?.length > 0;
    const taskCondition = buildDynamicCondition({
      '((th."extrinsicHash" IS NOT NULL AND th.status != \'failed\') OR th."extrinsicHash" IS NULL)': true,
      't."gameId" in (:gameIds)': filerByGameIds,
      'th."taskId" in (:taskIds)': filterByTaskIds,
      'th."accountId" = :accountId': !!accountId,
      'th."createdAt" >= :startTime': !!startTime,
      'th."createdAt" <= :endTime': !!endTime,
    }, 'WHERE');

    const airdropCondition = buildDynamicCondition({
      'arl.type = \'NPS\' AND arl.status = \'RECEIVED\'': true,
      'arl."createdAt" >= :startTime': !!startTime,
      'arl."createdAt" <= :endTime': !!endTime,
    }, 'WHERE');

    const accountCondition = buildDynamicCondition({
      'a.id = :accountId': !!accountId,
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
               false as mine,
               point::INTEGER,
               rank::INTEGER
        FROM final_data r
           JOIN account a ON r.accountId = a.id
        ${accountCondition}
        ORDER BY rank ASC`;

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
