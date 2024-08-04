import {
  BaseLeaderBoard,
  LeaderBoardItem,
  LeaderBoardQueryInputRaw,
} from '@src/services/leaderboards/BaseLeaderBoard';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {QueryTypes} from 'sequelize';
import {buildDynamicCondition} from '@src/utils';

export class ReferralLeaderBoard extends BaseLeaderBoard {
  async queryData(input: LeaderBoardQueryInputRaw): Promise<LeaderBoardItem[]> {
    const {type, gameIds, taskIds, accountId, startTime, endTime, metadata} = input;
    const refLevel = metadata?.refLevel || 0;
    console.log('refLevel', refLevel);

    const timeStatement = {
      '"createdAt" >= :startTime': !!startTime,
      '"createdAt" <= :endTime': !!endTime,
    };

    const filterByGameIds = !!gameIds && gameIds?.length > 0;
    const gameCondition = buildDynamicCondition({
      '"gameId" IN (:gameIds)': filterByGameIds,
      '"accountId" = :accountId': !!accountId,
      ...timeStatement,
    }, 'WHERE');

    let pointQuery = 'SUM(coalesce(point, 0))';
    let indirectPointQuery = 'SUM(coalesce("indirectPoint", 0))';


    let sqlPlayGame = '';
    const inviteToPlayStatement: Record<string, boolean> = {};

    if (type.includes('inviteToPlay')) {
      sqlPlayGame = `
      game_play_data as (SELECT "accountId"
                   FROM game_play
                   ${gameCondition}),
      `;
      inviteToPlayStatement['"invitedAccountId" in (SELECT "accountId" from game_play_data)'] = true;
    }

    const sourceAccountCondition = buildDynamicCondition({
      ...inviteToPlayStatement,
      ...timeStatement,
      '"sourceAccountId" = :accountId': !!accountId,
    }, 'WHERE');

    const indirectAccountCondition = buildDynamicCondition({
      ...inviteToPlayStatement,
      ...timeStatement,
      '"indirectAccount" = :accountId': !!accountId,
    }, 'WHERE');

    let sqlUpgradeRankSourceAccount = `
      UNION ALL
      SELECT "sourceAccountId"       AS accountId,
             Min("createdAt") as createdAt,
             ${pointQuery} AS point
      FROM referral_upgrade_log
      ${sourceAccountCondition}
      GROUP BY "sourceAccountId"
      `;
    let sqlUpgradeRankIndirectAccount = `
        UNION ALL
        SELECT "indirectAccount"                 AS accountId,
               Min("createdAt") as createdAt,
               ${indirectPointQuery} AS point
        FROM referral_upgrade_log
        ${indirectAccountCondition}
        GROUP BY "indirectAccount"
      `;
    if (type.endsWith('quantity')) {
      pointQuery = 'count(id)';
      indirectPointQuery = 'count(id)';
      sqlUpgradeRankSourceAccount = '';
      sqlUpgradeRankIndirectAccount = '';
    }

    let queryF1 = `
        SELECT "sourceAccountId" AS accountId,
               Min("createdAt")  as createdAt,
               ${pointQuery}     AS point
        FROM referral_log
        ${sourceAccountCondition}
        GROUP BY "sourceAccountId"
    ` + sqlUpgradeRankSourceAccount;

    let queryF2 = `
        SELECT "indirectAccount"     AS accountId,
               Min("createdAt")      as createdAt,
               ${indirectPointQuery} AS point
        FROM referral_log
        ${indirectAccountCondition}
        GROUP BY "indirectAccount"
    ` + sqlUpgradeRankIndirectAccount;

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
            combined_point AS (${queryF1} ${unionAll} ${queryF2}),
           rankedUsers AS (SELECT accountId,
                                    RANK() OVER (ORDER BY SUM(point) DESC, MIN(combined_point.createdAt) ASC) as rank,
                                    SUM(point)                             AS point
                             FROM combined_point 
                             JOIN account a on a.id = accountId
                             where a."isEnabled"
                             GROUP BY accountId)
        SELECT a.id                AS "accountId",
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
        ORDER BY point DESC
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
