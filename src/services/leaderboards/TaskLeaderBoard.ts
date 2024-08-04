import {
  BaseLeaderBoard,
  LeaderBoardItem,
  LeaderBoardQueryInputRaw,
  LeaderboardType,
} from '@src/services/leaderboards/BaseLeaderBoard';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {QueryTypes} from 'sequelize';
import {buildDynamicCondition} from "@src/utils";

export class TaskLeaderBoard extends BaseLeaderBoard {
  async queryData(input: LeaderBoardQueryInputRaw): Promise<LeaderBoardItem[]> {
    const type = input.type;
    const gameIds = input.context?.games || [];
    const taskIds = input.context?.tasks || [];
    const accountId = input.accountId;
    const startTime = input.startTime;
    const endTime = input.endTime;

    const conditionQuery = buildDynamicCondition({
      '((t."extrinsicHash" is not null and t.status != \'failed\')': true,
      'ta."gameId" IN (:gameIds)': gameIds.length > 0,
      't."taskId" IN (:taskIds)': taskIds.length > 0,
      't."accountId" = :accountId': !!accountId,
      't."createdAt" >= :startTime': !!startTime,
      't."createdAt" <= :endTime': !!endTime,
    }, 'WHERE');

    let pointQuery = 'SUM(coalesce(t."pointReward", 0))';
    if (type === LeaderboardType.TASK_QUANTITY) {
      pointQuery = 'count(distinct t.id)';
    }

    const sql = `
        SELECT t."accountId",
               a."telegramUsername",
               a."firstName",
               a.address,
               a."lastName",
               a."photoUrl"                                               as avatar,
               false                                                      as mine,
               ${pointQuery}                                              AS point,
               MIN(t."createdAt")                                         as "createdAt",
               RANK()
               OVER (ORDER BY ${pointQuery} DESC, MIN(t."createdAt") asc) as rank
        FROM task_history t
                 JOIN
             account a
             ON t."accountId" = a.id
                 JOIN task ta on t."taskId" = ta.id
            ${conditionQuery}
        GROUP BY 1, 2, 3, 4, 5, 6, 7
        ORDER BY rank asc
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
