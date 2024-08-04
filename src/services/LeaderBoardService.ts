import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import {
  LeaderboardPerson,
} from '@src/models';
import { QueryTypes } from 'sequelize';
import {LeaderboardItem, LeaderboardMetadata} from '@src/types';
import {KeyValueStoreService} from '@src/services/KeyValueStoreService';
import * as console from 'node:console';
import {calculateStartAndEnd, getLastDayOfYearCurrent} from '@src/utils/date';
import {
  BaseLeaderBoard,
  LeaderboardContext,
  LeaderBoardQueryInputRaw,
} from '@src/services/leaderboards/BaseLeaderBoard';
import {GameCasualLeaderBoard} from '@src/services/leaderboards/GameCasualLeaderBoard';
import logger from 'jet-logger';
import {GameFarmingLeaderBoard} from '@src/services/leaderboards/GameFarmingLeaderBoard';
import {ReferralLeaderBoard} from '@src/services/leaderboards/ReferralLeaderBoard';
import {TaskLeaderBoard} from '@src/services/leaderboards/TaskLeaderBoard';
import {SummaryLeaderBoard} from "@src/services/leaderboards/SummaryLeaderBoard";


export interface LeaderboardParams {
    id: number;
    context: LeaderboardContext;
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

  async getConfig(){
    const leaderboard_map = await KeyValueStoreService.instance.get('leaderboard_map') as unknown as LeaderboardItem[];
    const leaderboard_general = await KeyValueStoreService.instance.get('leaderboard_general');
    return {leaderboard_map, leaderboard_general};
  }
  async fetchData(accountId: number, id: number, context: LeaderboardContext = {}, limit = 100){
    const leaderboardList = await KeyValueStoreService.instance.get('leaderboard_map') as unknown as LeaderboardItem[];
    const leaderboard = leaderboardList.find(item => item.id === id);
    if (leaderboard){
      let startTime = leaderboard.startTime as unknown as string;
      let endTime = leaderboard.endTime as unknown as string;

      // TO DO: check task and game by array
      let gameIds = leaderboard.games;
      let taskIds = leaderboard.tasks;
      if (context.games){
        gameIds = context.games;
      }
      if (context.tasks){
        taskIds = context.tasks;
      }
      const metaData = leaderboard.metadata;
      const type = leaderboard.type;
      if (leaderboard.specialTime){
        const timeData = calculateStartAndEnd(leaderboard.specialTime);
        startTime = timeData.start  as unknown as string;
        endTime = timeData.end as unknown as string;
      }
      const data = await this.getTotalLeaderboard(accountId, startTime, endTime, gameIds, taskIds, limit, type, metaData);
      return data;
    }
  }

  getGameQuery(gameIds: number[], type = 'nps') {
    const queryGame = gameIds.length > 0 ? 'and gd."gameId" in (:gameIds)' : '';
    let sumPoint = 'SUM(coalesce(gd.point, 0))';
    if (type === 'point') {
      sumPoint = 'SUM(coalesce(gd."gamePoint", 0))';
    }
    if (type === 'quantity') {
      sumPoint = 'count(distinct gd.id)';
    }
    const sql = `
        with RankedUsers as (SELECT gd."accountId",
                                    a."telegramUsername",
                                    a.address,
                                    a."firstName",
                                    a."lastName",
                                    a."photoUrl"                                           as avatar,
                                    (a.id = :accountId)                                    as mine,
                                    ${sumPoint}                             AS point,
                                    RANK() OVER (ORDER BY ${sumPoint} DESC, MIN(gd."createdAt") asc) as rank
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

  getFarmingPointQuery(gameId: number[], field: string) {
    const queryGame = gameId.length > 0 ? 'and gd."gameId" = (:gameIds)' : '';
    const query = `
    WITH LastGamePlay AS (
    SELECT
        gd."accountId",
        a."telegramUsername",
        a.address,
        a."firstName",
        a."lastName",
        a."photoUrl" AS avatar,
        (a.id = :accountId)           AS mine,
        coalesce(CAST(gd."stateData" ->> '${field}' AS NUMERIC), 0) AS point,
        gd."createdAt",
        ROW_NUMBER() OVER (PARTITION BY gd."accountId" ORDER BY gd."createdAt" DESC) AS rn
    FROM
        game_play gd
        JOIN account a ON gd."accountId" = a.id
    WHERE
        gd."createdAt" >= :startDate
        and gd."createdAt" <= :endDate
        AND gd.success IS TRUE
      and a."isEnabled" IS TRUE
        ${queryGame}
)
      , RankedUsers AS (
          SELECT
              "accountId",
              "telegramUsername",
              address,
              "firstName",
              "lastName",
              avatar,
              mine,
              point,
              RANK() OVER (ORDER BY point DESC, "createdAt" ASC) AS rank
          FROM
              LastGamePlay
          WHERE
              rn = 1
      )
      SELECT *
      FROM RankedUsers
      where rank <= :limit
                 or mine = true
      ORDER BY rank ASC;
    `;
    return query;
  }

  getTaskQuery(gameIds: number[], taskIds: number[], type = 'nps') {
    const queryTaskGame = gameIds.length > 0 ? 'and ta."gameId" IN (:gameIds)' : '';
    const queryTask = taskIds.length > 0 ? 'and t."taskId" IN (:taskIds)' : '';
    let sumPoint = 'SUM(coalesce(t."pointReward", 0))';
    if (type !== 'nps') {
      sumPoint = 'count(distinct t.id)';
    }
    const sql = `
        with RankedUsers as (SELECT t."accountId",
                                    a."telegramUsername",
                                    a."firstName",
                                    a.address,
                                    a."lastName",
                                    a."photoUrl"                                                                   as avatar,
                                    (a.id = :accountId)                                                            as mine,
                                    ${sumPoint}                                              AS point,
                                    MIN(t."createdAt")                                                             as "createdAt",
                                    RANK()
                                    OVER (ORDER BY ${sumPoint} DESC, MIN(t."createdAt") asc) as rank
                             FROM task_history t
                                      JOIN
                                  account a
                                  ON t."accountId" = a.id
                             JOIN task ta on t."taskId" = ta.id
                             where t."createdAt" >= :startDate
                               and t."createdAt" <= :endDate
                             and ((t."extrinsicHash" is not null and t.status != 'failed') 
                                        or t."extrinsicHash" is null)
                             ${queryTaskGame} ${queryTask}
                             GROUP BY 1, 2, 3, 4, 5, 6, 7
                             ORDER BY rank asc)
        select *
        from RankedUsers
        where rank <= :limit
           or mine = true;
    `;
    return sql;
  }

  getReferralLogQuery(refLevel = 0) {
    let queryF1 = `
    SELECT "sourceAccountId"       AS accountId,
                                       Min("createdAt") as createdAt,
                                       SUM(coalesce(point, 0)) AS point
                                FROM referral_log
                                where "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                GROUP BY "sourceAccountId"
                                UNION ALL
                                SELECT "sourceAccountId"       AS accountId,
                                       Min("createdAt") as createdAt,
                                       SUM(coalesce(point, 0)) AS point
                                FROM referral_upgrade_log
                                where "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                GROUP BY "sourceAccountId"
    `;
    let queryF2 = `
    SELECT "indirectAccount"                 AS accountId,
                                       Min("createdAt") as createdAt,
                                       SUM(coalesce("indirectPoint", 0)) AS point
                                FROM referral_log
                                where "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                GROUP BY "indirectAccount"
                                
                                UNION ALL
                                SELECT "indirectAccount"                 AS accountId,
                                       Min("createdAt") as createdAt,
                                       SUM(coalesce("indirectPoint", 0)) AS point
                                FROM referral_upgrade_log
                                where "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                GROUP BY "indirectAccount"
    `;
    const unionAll = refLevel === 0 || refLevel > 2 ? ' UNION ALL ' : '';
    if (refLevel == 1){
      queryF2 = '';
    }
    if (refLevel == 2) {
      queryF1 = '';
    }
    const sql = `
        with combinedPoints as (
          ${queryF1}
                                ${unionAll}
                                ${queryF2}
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
  getReferralQuantityLogQuery(refLevel = 0) {
    let queryF1 = `
    SELECT "sourceAccountId"       AS accountId,
                                       Min("createdAt") as createdAt,
                                       count(distinct id) AS point
                                FROM referral_log
                                where "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                GROUP BY "sourceAccountId"
    `;
    let queryF2 = `
        SELECT "indirectAccount"                 AS accountId,
                                       Min("createdAt") as createdAt,
                                       count(distinct id) AS point
                                FROM referral_log
                                where "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                GROUP BY "indirectAccount"
    `;
    const unionAll = refLevel === 0 || refLevel > 2 ? ' UNION ALL ' : '';
    if (refLevel == 1){
      queryF2 = '';
    }
    if (refLevel == 2) {
      queryF1 = '';
    }
    const sql = `
        with combinedPoints as (
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

  getInviteToPlayQuantity(gameId: number[], refLevel = 0) {
    const queryGame = gameId.length > 0 ? 'and "gameId" in (:gameIds)' : '';
    let queryF1 = `
    SELECT "sourceAccountId"       AS accountId,
                                       Min("createdAt") as createdAt,
                                       count(distinct id) AS point
                                FROM referral_log
                                where "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                and "invitedAccountId" in (SELECT "accountId" from playGamme)
                                GROUP BY "sourceAccountId"
    `;
    let queryF2 = `
        SELECT "indirectAccount"                 AS accountId,
                                       Min("createdAt") as createdAt,
                                       count(distinct id) AS point
                                FROM referral_log
                                where "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                and "invitedAccountId" in (SELECT "accountId" from playGamme)
                                GROUP BY "indirectAccount"
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
            playGamme as (SELECT "accountId"
                   FROM game_play
                   where  "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                     ${queryGame}
                   ),
            
            combinedPoints as (${queryF1} ${unionAll} ${queryF2}),
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

  getInviteToPlayNps(gameId: number[], refLevel = 0) {
    let queryF1 = `
    SELECT "sourceAccountId"       AS accountId,
                                       Min("createdAt") as createdAt,
                                       SUM(coalesce(point, 0)) AS point
                                FROM referral_log
                                where "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                and "invitedAccountId" in (SELECT "accountId" from playGamme)
                                GROUP BY "sourceAccountId"
                                UNION ALL
                                SELECT "sourceAccountId"       AS accountId,
                                       Min("createdAt") as createdAt,
                                       SUM(coalesce(point, 0)) AS point
                                FROM referral_upgrade_log
                                where "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                and "invitedAccountId" in (SELECT "accountId" from playGamme)
                                GROUP BY "sourceAccountId"
    `;
    let queryF2 = `
    SELECT "indirectAccount"                 AS accountId,
                                       Min("createdAt") as createdAt,
                                       SUM(coalesce("indirectPoint", 0)) AS point
                                FROM referral_log
                                where "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                and "invitedAccountId" in (SELECT "accountId" from playGamme)
                                GROUP BY "indirectAccount"
                                
                                UNION ALL
                                SELECT "indirectAccount"                 AS accountId,
                                       Min("createdAt") as createdAt,
                                       SUM(coalesce("indirectPoint", 0)) AS point
                                FROM referral_upgrade_log
                                where "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                and "invitedAccountId" in (SELECT "accountId" from playGamme)
                                GROUP BY "indirectAccount"
    `;
    const unionAll = refLevel === 0 || refLevel > 2 ? ' UNION ALL ' : '';
    if (refLevel == 1){
      queryF2 = '';
    }
    if (refLevel == 2) {
      queryF1 = '';
    }
    const queryGame = gameId.length > 0 ? 'and "gameId" in (:gameIds)' : '';
    const sql = `

        with 
            playGamme as (SELECT "accountId"
                   FROM game_play
                   where  "createdAt" >= :startDate
                                  and "createdAt" <= :endDate
                                     ${queryGame}
                   ),
            
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

  getAllDataQuery(gameIds: number[], taskIds: number[]) {
    const queryGame = gameIds.length > 0 ? 'and "gameId" in (:gameIds)' : '';
    const queryTaskGame = gameIds.length > 0 ? 'and t."gameId" in (:gameIds)' : '';
    const queryTask = taskIds.length > 0 ? 'and th."taskId" in (:taskIds)' : '';
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
                               ${queryTaskGame} ${queryTask}
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

  // Todo: Auto clear cache after 10 minutes not used
  private leaderboardMap: Record<string, BaseLeaderBoard> = {};

  async getLeaderBoardV2(accountId: number, input: LeaderBoardQueryInputRaw) {
    const key = BaseLeaderBoard.getKey(input);

    let leaderBoard = this.leaderboardMap[key];
    if (!leaderBoard) {
      logger.info(`Create new leader board with key: ${key}`);
      if (input.type.startsWith('game:casual')) {
        leaderBoard = new GameCasualLeaderBoard(input);
      } else if (input.type.startsWith('game:farming')) {
        leaderBoard = new GameFarmingLeaderBoard(input);
      } else if (input.type.startsWith('referral')) {
        leaderBoard = new ReferralLeaderBoard(input);
      } else if (input.type.startsWith('task')) {
        leaderBoard = new TaskLeaderBoard(input);
      }else if (input.type.startsWith('all')) {
        leaderBoard = new SummaryLeaderBoard(input);
      }
      this.leaderboardMap[key] = leaderBoard;
    }

    if (!leaderBoard) {
      return [];
    }

    return await leaderBoard.fetchLeaderBoard(accountId);
  }

  async getTotalLeaderboard(
    accountId: number,
    startDate: string,
    endDate: string,
    gameIds: number[],
    taskIds: number[],
    limit = 100,
    typeQuery = 'all:nps',
    metaData: LeaderboardMetadata | undefined,
  ) {
    let sql = this.getAllDataQuery(gameIds, taskIds);
    let refLevel = 0;
    if (metaData && metaData.refLevel){
      refLevel = metaData.refLevel;
    }
    if (typeQuery === 'game:casual:nps') {
      sql = this.getGameQuery(gameIds);
    } else if (typeQuery === 'game:casual:point') {
      sql = this.getGameQuery(gameIds, 'point');
    } else if (typeQuery === 'game:casual:quantity') {
      sql = this.getGameQuery(gameIds, 'quantity');
    } else if (typeQuery === 'task:nps') {
      sql = this.getTaskQuery(gameIds, taskIds);
    }  else if (typeQuery === 'task:quantity') {
      sql = this.getTaskQuery(gameIds, taskIds, 'quantity');
    } else if (typeQuery === 'accumulatePoint') {
      sql = this.getAccumulatePoint();
    } else if (typeQuery === 'referral:nps') {
      sql = this.getReferralLogQuery(refLevel);
    } else if (typeQuery === 'referral:quantity') {
      sql = this.getReferralQuantityLogQuery(refLevel);
    } else if (typeQuery === 'referral:inviteToPlay:nps') {
      sql = this.getInviteToPlayNps(gameIds, refLevel);
    }  else if (typeQuery === 'referral:inviteToPlay:quantity') {
      sql = this.getInviteToPlayQuantity(gameIds, refLevel);
    } else if (typeQuery.startsWith('game:farming')) {
      let field = 'coin';
      if (typeQuery === 'game:farming:totalPoint') {
        field = 'totalLifetimeMoney';
      }
      if (typeQuery === 'game:farming:earnSpeed') {
        field = 'coinEarnPerSecond';
      }
      sql = this.getFarmingPointQuery(gameIds, field);
    }
    let start = startDate;
    let end = endDate;
    if (!start){
      start = '2024-01-01';
    }

    if (!end){
      end = getLastDayOfYearCurrent();
    }

    try {
      const data = await this.sequelizeService.sequelize.query<LeaderboardRecord>(sql, {
        replacements: { accountId, gameIds, taskIds, startDate: start, endDate: end, limit }, // Use replacements for parameterized queries
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
