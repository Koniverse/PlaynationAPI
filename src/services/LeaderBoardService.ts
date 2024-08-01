import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import {
  Game,
  KeyValueStore,
  Leaderboard,
  LeaderboardPerson,
  Task,
} from '@src/models';
import { QueryTypes } from 'sequelize';
import {LeaderboardContentCms} from '@src/types';
import {KeyValueStoreService} from '@src/services/KeyValueStoreService';
import * as console from 'node:console';
import {calculateStartAndEnd} from "@src/utils/date";

export interface LeaderboardParams {
  gameId: number;
  startDate: string;
  endDate: string;
  type: 'accumulatePoint' | 'game' | 'task' | 'referral' | 'all';
  limit: number;
}
export interface LeaderboardNewParams {
  id: number;
  context: string;
  limit: number;
}

export interface LeaderboardRecord {
  rank: string; // SQL query returns rank as string
  accountId: number;
  address: string;
  firstName: string;
  lastName: string;
  point: string; // SQL query returns point as string
  telegramUsername: string;
  avatar: string;
  mine: boolean;
}

export class LeaderBoardService {
  constructor(private sequelizeService: SequelizeService) {}


  async syncData(data: LeaderboardContentCms) {
    try {
      const { data: leaderboardData, leaderboard_general } = data;
      const keyValue = await KeyValueStore.findOne({where: {key: 'leaderboard_general'}});
      if (keyValue) {
        await keyValue.update({ value: leaderboard_general} as unknown as KeyValueStore);
      } else {
        await KeyValueStore.create({
          key: 'leaderboard_general',
          value: leaderboard_general,
        } as unknown as KeyValueStore);
      }

      for (const item of leaderboardData) {
        const itemData = {...item} as unknown as Leaderboard;
        const existed = await Leaderboard.findOne({where: {contentId: item.id}});
        const contentGameId = item.games;
        const contentTaskId = item.tasks;
        const gameList = await Game.findAll({where: {contentId: contentGameId}});
        // @ts-ignore
        itemData.games = [];
        if(gameList) {
          // @ts-ignore
          itemData.games = gameList.map(game => game.id);
        }
        const taskList = await Task.findAll({where: {contentId: contentTaskId}});
        // @ts-ignore
        itemData.tasks = [];
        if(taskList) {
          // @ts-ignore
          itemData.tasks = taskList.map(task => task.id);
        }

        // Sync data
        if (existed) {
          await existed.update(itemData);
        } else {
          itemData.contentId = item.id;
          await Leaderboard.create(itemData);
        }
      }
      await KeyValueStoreService.instance.buildMap();
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  async fetchData(accountId: number, id: number, context: string, limit = 100){
    console.log(id, accountId);
    const leaderboard = await Leaderboard.findOne({
      where: {'contentId': id},
    });
    if (leaderboard){
      let startTime = leaderboard.startTime as unknown as string;
      let endTime = leaderboard.endTime as unknown as string;
      const gameIds = leaderboard.games;
      const taskIds = leaderboard.tasks;
      const type = leaderboard.type;
      if (leaderboard.specialTime){
        const timeData = calculateStartAndEnd(leaderboard.specialTime);
        startTime = timeData.start  as unknown as string;
        endTime = timeData.end as unknown as string;
      }
      const data = await this.getTotalLeaderboard(accountId, 0, startTime, endTime, limit);
      return data;
    }
  }

  getGameQuery(gameId: number) {
    const queryGame = gameId > 0 ? 'and gd."gameId" = :gameId' : '';
    const sql = `
        with RankedUsers as (SELECT gd."accountId",
                                    a."telegramUsername",
                                    a.address,
                                    a."firstName",
                                    a."lastName",
                                    a."photoUrl"                                           as avatar,
                                    (a.id = :accountId)                                    as mine,
                                    SUM(coalesce(gd.point, 0))                             AS point,
                                    RANK() OVER (ORDER BY SUM(coalesce(gd.point, 0)) DESC, MIN(gd."createdAt") asc) as rank
                             FROM game_play gd
                                      JOIN
                                  account a
                                  ON gd."accountId" = a.id
                             where gd."createdAt" >= :startDate
                               and gd."createdAt" <= :endDate
                                and gd.success is true
                                 ${queryGame}
                             GROUP BY 1, 2, 3, 4, 5, 6, 7
                             ORDER BY rank asc)
        select *
        from RankedUsers
        where rank <= :limit
           or mine = true;
    `;
    return sql;
  }

  getGamePointQuery(gameId: number) {
    const queryGame = gameId > 0 ? 'and gd."gameId" = :gameId' : '';
    const sql = `
        with RankedUsers as (SELECT gd."accountId",
                                    a."telegramUsername",
                                    a.address,
                                    a."firstName",
                                    a."lastName",
                                    a."photoUrl"                                           as avatar,
                                    (a.id = :accountId)                                    as mine,
                                    SUM(coalesce(gd."gamePoint", 0))                             AS point,
                                    RANK() OVER (ORDER BY SUM(coalesce(gd."gamePoint", 0)) DESC, MIN(gd."createdAt") asc) as rank                                    
                             FROM game_play gd
                                      JOIN
                                  account a
                                  ON gd."accountId" = a.id
                             where gd."createdAt" >= :startDate
                               and gd."createdAt" <= :endDate
                                and gd.success is true
                                 ${queryGame}
                             GROUP BY 1, 2, 3, 4, 5, 6, 7
                             ORDER BY rank asc)
        select *
        from RankedUsers
        where rank <= :limit
           or mine = true;
    `;
    return sql;
  }

  getFarmingPointQuery(gameId: number, field: string) {
    const queryGame = gameId > 0 ? 'and gd."gameId" = :gameId' : '';
    const sql = `
        with RankedUsers as (SELECT gd."accountId",
                                    a."telegramUsername",
                                    a.address,
                                    a."firstName",
                                    a."lastName",
                                    a."photoUrl"                                           as avatar,
                                    (a.id = :accountId)                                    as mine,
                                    SUM(coalesce(CAST(gd."stateData"->>'${field}' AS NUMERIC), 0))                             AS point,
                                    RANK() OVER (ORDER BY SUM(coalesce(CAST(gd."stateData"->>'${field}' AS NUMERIC), 0)) DESC, MIN(gd."createdAt") asc) as rank                                    
                             FROM game_play gd
                                      JOIN
                                  account a
                                  ON gd."accountId" = a.id
                             where gd."createdAt" >= :startDate
                               and gd."createdAt" <= :endDate
                                and gd.success is true
                                 ${queryGame}
                             GROUP BY 1, 2, 3, 4, 5, 6, 7
                             ORDER BY rank asc)
        select *
        from RankedUsers
        where rank <= :limit
           or mine = true;
    `;
    return sql;
  }

  getTaskQuery(gameId: number) {
    const queryTaskGame = gameId > 0 ? 'and ta."gameId" = :gameId' : '';
    const sql = `
        with RankedUsers as (SELECT t."accountId",
                                    a."telegramUsername",
                                    a."firstName",
                                    a.address,
                                    a."lastName",
                                    a."photoUrl"                                                                   as avatar,
                                    (a.id = :accountId)                                                            as mine,
                                    SUM(coalesce(t."pointReward", 0))                                              AS point,
                                    MIN(t."createdAt")                                                             as "createdAt",
                                    RANK()
                                    OVER (ORDER BY SUM(coalesce(t."pointReward", 0)) DESC, MIN(t."createdAt") asc) as rank
                             FROM task_history t
                                      JOIN
                                  account a
                                  ON t."accountId" = a.id
                             JOIN task ta on t."taskId" = ta.id
                             where t."createdAt" >= :startDate
                               and t."createdAt" <= :endDate
                             and ((t."extrinsicHash" is not null and t.status != 'failed') 
                                        or t."extrinsicHash" is null)
                             ${queryTaskGame}
                             GROUP BY 1, 2, 3, 4, 5, 6, 7
                             ORDER BY rank asc)
        select *
        from RankedUsers
        where rank <= :limit
           or mine = true;
    `;
    return sql;
  }

  getReferralLogQuery() {
    const sql = `

        with combinedPoints as (SELECT "sourceAccountId"       AS accountId,
                                       Min("createdAt") as createdAt,
                                       SUM(coalesce(point, 0)) AS point
                                FROM referral_log
                                where "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                GROUP BY "sourceAccountId"
                                UNION ALL
                                SELECT "indirectAccount"                 AS accountId,
                                       Min("createdAt") as createdAt,
                                       SUM(coalesce("indirectPoint", 0)) AS point
                                FROM referral_log
                                where "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                GROUP BY "indirectAccount"
                                UNION ALL
                                SELECT "sourceAccountId"       AS accountId,
                                       Min("createdAt") as createdAt,
                                       SUM(coalesce(point, 0)) AS point
                                FROM referral_upgrade_log
                                where "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                GROUP BY "sourceAccountId"
                                UNION ALL
                                SELECT "indirectAccount"                 AS accountId,
                                       Min("createdAt") as createdAt,
                                       SUM(coalesce("indirectPoint", 0)) AS point
                                FROM referral_upgrade_log
                                where "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                GROUP BY "indirectAccount"),
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
               (a.id = :accountId) as mine,
               ra.point            AS point
        FROM rankedUsers ra
                 JOIN account a ON ra.accountId = a.id
        where ra.rank <= :limit
           or a.id = :accountId
        ORDER BY point DESC;
    `;
    return sql;
  }

  getInviteToPlayQuery(gameId: number) {
    const queryGame = gameId > 0 ? 'and "gameId" = :gameId' : '';
    const sql = `

        with 
            playGamme as (SELECT "accountId"
                   FROM game_play
                   where  "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                     ${queryGame}
                   ),
            
            combinedPoints as (SELECT "sourceAccountId"       AS accountId,
                                   Min("createdAt") as createdAt,
                                       SUM(coalesce(point, 0)) AS point
                                FROM referral_log
                                where "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                and "invitedAccountId" in (SELECT "accountId" from playGamme)
                                GROUP BY "sourceAccountId"
                                UNION ALL
                                SELECT "indirectAccount"                 AS accountId,
                                    Min("createdAt") as createdAt,
                                       SUM(coalesce("indirectPoint", 0)) AS point
                                FROM referral_log
                                where "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                and "invitedAccountId" in (SELECT "accountId" from playGamme)
                                GROUP BY "indirectAccount"
                                UNION ALL
                                SELECT "sourceAccountId"       AS accountId,
                                    Min("createdAt") as createdAt,
                                       SUM(coalesce(point, 0)) AS point
                                FROM referral_upgrade_log
                                where "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                and "invitedAccountId" in (SELECT "accountId" from playGamme)
                                GROUP BY "sourceAccountId"
                                UNION ALL
                                SELECT "indirectAccount"                 AS accountId,
                                    Min("createdAt") as createdAt,
                                       SUM(coalesce("indirectPoint", 0)) AS point
                                FROM referral_upgrade_log
                                where "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                and "invitedAccountId" in (SELECT "accountId" from playGamme)
                                GROUP BY "indirectAccount"),
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
               (a.id = :accountId) as mine,
               ra.point            AS point
        FROM rankedUsers ra
                 JOIN account a ON ra.accountId = a.id
        where ra.rank <= :limit
           or a.id = :accountId
        ORDER BY point DESC;
    `;
    return sql;
  }

  getAllDataQuery(gameId: number) {
    const queryGame = gameId > 0 ? 'and "gameId" = :gameId' : '';
    const queryTaskGame = gameId > 0 ? 'and t."gameId" = :gameId' : '';
    const sql = `
        with RankedUsers as (SELECT "sourceAccountId"       AS accountId,
                                    MIN("createdAt")        as "createdAt",
                                    SUM(coalesce(point, 0)) AS point
                             FROM referral_log
                             where "createdAt" >= :startDate
                               and "createdAt" <= :endDate
                             GROUP BY "sourceAccountId"
                             UNION ALL
                             SELECT "indirectAccount"                 AS accountId,
                                    MIN("createdAt")                  as "createdAt",
                                    SUM(coalesce("indirectPoint", 0)) AS point
                             FROM referral_log
                             where "createdAt" >= :startDate
                               and "createdAt" <= :endDate
                             GROUP BY "indirectAccount"

                             UNION ALL
                             SELECT "sourceAccountId"       AS accountId,
                                    MIN("createdAt")        as "createdAt",
                                    SUM(coalesce(point, 0)) AS point
                             FROM referral_upgrade_log
                             where "createdAt" >= :startDate
                               and "createdAt" <= :endDate
                             GROUP BY "sourceAccountId"
                             UNION ALL
                             SELECT "indirectAccount"                 AS accountId,
                                    MIN("createdAt")                  as "createdAt",
                                    SUM(coalesce("indirectPoint", 0)) AS point
                             FROM referral_upgrade_log
                             where "createdAt" >= :startDate
                               and "createdAt" <= :endDate
                             GROUP BY "indirectAccount"

                             UNION ALL
                             SELECT "accountId"             AS accountId,
                                    MIN("createdAt")        as "createdAt",
                                    SUM(coalesce(point, 0)) AS point
                             FROM game_play
                             where "createdAt" >= :startDate
                               and "createdAt" <= :endDate
                                and success is true
                                 ${queryGame}
                             GROUP BY 1
                             UNION ALL
                             SELECT "accountId"             AS accountId,
                                    MIN("createdAt")        as "createdAt",
                                    SUM(coalesce(point, 0)) AS point
                             FROM giveaway_point
                             where "createdAt" >= :startDate
                               and "createdAt" <= :endDate
                             GROUP BY 1
                             UNION ALL
                             SELECT th."accountId"                     AS accountId,
                                    MIN(th."createdAt")                as "createdAt",
                                    SUM(coalesce(th."pointReward", 0)) AS point
                             FROM task_history th
                             JOIN task t on th."taskId" = t.id
                             where th."createdAt" >= :startDate
                               and th."createdAt" <= :endDate
                               and ((th."extrinsicHash" is not null and th.status != 'failed') 
                                        or th."extrinsicHash" is null)
                               ${queryTaskGame}
                             GROUP BY 1
                               UNION ALL
                     SELECT arl.account_id       AS "accountId",
                            MIN(arl."createdAt") as "createdAt",
                            sum(ar.point)        as point
                     from airdrop_record_log arl
                              JOIN public.airdrop_records ar on ar.id = arl.airdrop_record_id
                     where arl.type = 'NPS'
                       AND arl.status = 'RECEIVED'
                     and arl."createdAt" >= :startDate
                       and arl."createdAt" <= :endDate
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
               (accountId = :accountId) as mine,
               point,
               rank
        FROM totalData r
                 JOIN account a ON r.accountId = a.id
        where rank <= :limit or accountId = :accountId
        order by rank asc;

    `;
    return sql;
  }

  getAccumulatePoint() {
    const sql = `
        WITH RankedUsers AS (SELECT a.id,
                                    a."address",
                                    a."firstName",
                                    a."lastName",
                                    a."telegramUsername",
                                    a."photoUrl"                                     as avatar,
                                    aa."accumulatePoint"                             as point,
                                    RANK() OVER (ORDER BY aa."accumulatePoint" DESC) as rank,
                                    (a.id = :accountId)                              as mine
                             FROM account_attribute aa
                                      JOIN public.account a ON a.id = aa."accountId")
        SELECT rank,
               id as accountId,
               "address",
               "firstName",
               "lastName",
               point,
               "telegramUsername",
               avatar,
               mine
        FROM RankedUsers
        WHERE rank <= :limit
           OR mine = true
        ORDER BY rank;
    `;
    return sql;
  }

  async getTotalLeaderboard(
    accountId: number,
    gameId: number,
    startDate: string,
    endDate: string,
    limit = 100,
    typeQuery = 'all:nps',
  ) {
    let sql = this.getAllDataQuery(gameId);
    if (typeQuery === 'game:casual:nps') {
      sql = this.getGameQuery(gameId);
    } else if (typeQuery === 'task:nps') {
      sql = this.getTaskQuery(gameId);
    } else if (typeQuery === 'game:casual:point') {
      sql = this.getGamePointQuery(gameId);
    } else if (typeQuery === 'accumulatePoint') {
      sql = this.getAccumulatePoint();
    } else if (typeQuery === 'referral:nps') {
      sql = this.getReferralLogQuery();
    } else if (typeQuery === 'inviteToPlay') {
      sql = this.getInviteToPlayQuery(gameId);
    } else if (typeQuery.startsWith('game:farming')) {
      let field = 'coin';
      if (typeQuery === 'game:farming:totalPoint') {
        field = 'totalLifetimeMoney';
      }
      if (typeQuery === 'game:farming:earnSpeed') {
        field = 'coinEarnPerSecond';
      }
      sql = this.getFarmingPointQuery(gameId, field);
    }

    try {
      const data = await this.sequelizeService.sequelize.query<LeaderboardRecord>(sql, {
        replacements: { accountId, gameId, startDate, endDate, limit }, // Use replacements for parameterized queries
        type: QueryTypes.SELECT,
      });

      return data.map(
        (item) =>
          ({
            rank: parseInt(item.rank),
            point: parseInt(item.point),
            mine: item.mine,
            accountInfo: {
              telegramUsername: item.telegramUsername,
              lastName: item.lastName,
              firstName: item.firstName,
              avatar: item.avatar,
              id: item.accountId,
              address: item.address,
            },
          } as LeaderboardPerson),
      );
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [] as LeaderboardPerson[]; // Return an empty array in case of an error
    }
  }

  // Singleton
  private static _instance: LeaderBoardService;
  public static get instance() {
    if (!LeaderBoardService._instance) {
      LeaderBoardService._instance = new LeaderBoardService(SequelizeServiceImpl);
    }
    return LeaderBoardService._instance;
  }
}
