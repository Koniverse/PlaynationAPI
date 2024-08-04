import {
  BaseLeaderBoard,
  LeaderBoardItem,
  LeaderBoardQueryInputRaw,
  LeaderboardType,
} from '@src/services/leaderboards/BaseLeaderBoard';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {QueryTypes} from 'sequelize';
import * as console from "node:console";

export class TaskLeaderBoard extends BaseLeaderBoard {
  async queryData(input: LeaderBoardQueryInputRaw): Promise<LeaderBoardItem[]> {
    const type = input.type;
    const gameIds = input.context?.games || [];
    const taskIds = input.context?.tasks || [];
    const accountId = input.accountId;
    const startTime = input.startTime;
    const endTime = input.endTime;

    const queryGame = gameIds.length > 0 ? 'AND ta."gameId" IN (:gameIds)' : '';
    const queryTask = taskIds.length > 0 ? 'AND t."taskId" IN (:taskIds)' : '';
    const queryAccount = accountId ? 'AND t."accountId" = :accountId' : '';
    const queryStartTime = startTime ? 'AND t."createdAt" >= :startTime' : '';
    const queryEndTime = endTime ? 'AND t."createdAt" <= :endTime' : '';

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
                                    a."photoUrl"                                                                   as avatar,
                                    false                                                          as mine,
                                    ${pointQuery}                                              AS point,
                                    MIN(t."createdAt")                                                             as "createdAt",
                                    RANK()
                                    OVER (ORDER BY ${pointQuery} DESC, MIN(t."createdAt") asc) as rank
                             FROM task_history t
                                      JOIN
                                  account a
                                  ON t."accountId" = a.id
                             JOIN task ta on t."taskId" = ta.id
                             where ((t."extrinsicHash" is not null and t.status != 'failed') 
                                        or t."extrinsicHash" is null)
                             ${queryGame} ${queryStartTime} ${queryEndTime} ${queryAccount} ${queryTask}
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
