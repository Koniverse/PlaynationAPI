import {
  BaseLeaderBoard,
  LeaderBoardItem,
  LeaderBoardQueryInputRaw,
} from '@src/services/leaderboards/BaseLeaderBoard';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {QueryTypes} from 'sequelize';
import {buildDynamicCondition} from '@src/utils';

export class AccountDailyLeaderBoard extends BaseLeaderBoard {
  async queryData(input: LeaderBoardQueryInputRaw): Promise<LeaderBoardItem[]> {
    const {gameIds, taskIds, accountIds, startTime, endTime} = input;
    const filterByAccountIds = !!accountIds && accountIds?.length > 0;

    const conditionQuery = buildDynamicCondition({
      'ad."accountId" IN (:accountIds)': filterByAccountIds,
      'ad."createdAt" >= :startTime': !!startTime,
      'ad."createdAt" <= :endTime': !!endTime,
    }, 'WHERE');


    const sql = `
        SELECT al."accountId",
               a."telegramUsername",
               a."firstName",
               a.address,
               a."lastName",
               a."photoUrl"                                               as avatar,
               false                                                      as mine,
               count(distinct al.id)                                      AS point,
               MIN(al."createdAt")                                        as "createdAt",
               RANK()
               OVER (ORDER BY count(distinct ad.id) DESC, MIN(al."createdAt") asc) as rank
        FROM account_login_log al
                 JOIN account a ON al."accountId" = a.id
            ${conditionQuery}
        GROUP BY 1, 2, 3, 4, 5, 6, 7
        ORDER BY rank asc
    `;

    const result = await SequelizeServiceImpl.sequelize.query<LeaderBoardItem>(sql, {
      type: QueryTypes.SELECT,
      replacements: {
        gameIds: gameIds,
        taskIds: taskIds,
        accountIds,
        startTime,
        endTime,
      },
    });

    return result;
  }
}
