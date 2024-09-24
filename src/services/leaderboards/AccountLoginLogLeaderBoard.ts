import {
  BaseLeaderBoard,
  LeaderBoardItem,
  LeaderBoardQueryInputRaw,
} from '@src/services/leaderboards/BaseLeaderBoard';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {QueryTypes} from 'sequelize';
import {buildDynamicCondition} from '@src/utils';

export class AccountLoginLogLeaderBoard extends BaseLeaderBoard {
  async queryData(input: LeaderBoardQueryInputRaw): Promise<LeaderBoardItem[]> {
    const {accountIds, startTime, endTime} = input;
    const filterByAccountIds = !!accountIds && accountIds?.length > 0;

    const conditionQuery = buildDynamicCondition({
      'al."accountId" IN (:accountIds)': filterByAccountIds,
      'al."createdAt" >= :startTime': !!startTime,
      'al."createdAt" <= :endTime': !!endTime,
    }, 'WHERE');

    // Get the consecutive login days
    const sql = `
    WITH login_data AS (SELECT al."accountId",
                           al."loginDate"::date                                                          as login_date,
                           ROW_NUMBER() OVER (PARTITION BY al."accountId" ORDER BY al."loginDate"::date) as row_num
                    FROM account_login_log al
                    ${conditionQuery}
                    order by al."loginDate" asc),
     consecutive_logins AS (SELECT ld."accountId",
                                   ld.login_date,
                                   ld.row_num,
                                   ld.login_date - INTERVAL '1 day' * ld.row_num AS group_identifier
                            FROM login_data ld),
     ranked_logins AS (SELECT cl."accountId",
                              cl.group_identifier,
                              COUNT(*) AS consecutive_days
                       FROM consecutive_logins cl
                       GROUP BY cl."accountId", cl.group_identifier)
    SELECT rl."accountId",
           a."telegramUsername",
           a."firstName",
           a.address,
           a."lastName",
           a."photoUrl" as avatar,
           false as mine,
           MAX(rl.consecutive_days)                                                           AS point,
           RANK() OVER (ORDER BY MAX(rl.consecutive_days) DESC, MIN(a."createdAt") asc ) as rank
    FROM ranked_logins rl
    JOIN account a ON rl."accountId" = a.id
    GROUP BY 1, 2, 3, 4, 5, 6
    ORDER BY rank ASC;`;

    const result = await SequelizeServiceImpl.sequelize.query<LeaderBoardItem>(sql, {
      type: QueryTypes.SELECT,
      replacements: {
        accountIds,
        startTime,
        endTime,
      },
    });

    return result;
  }
}
