import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import {LeaderboardPerson} from '@src/models';
import {QueryTypes} from 'sequelize';

export interface LeaderboardParams {
    gameId: number;
    startDate: string;
    endDate: string;
    type: 'accumulatePoint' | 'game' | 'task' | 'referral' | 'all';
    limit: number;
}

interface LeaderboardRecord {
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

  constructor(private sequelizeService: SequelizeService) {

  }

  getGameQuery( gameId: number) {
    const queryGame = gameId > 0 ? 'and gd."gameId" = :gameId' : '';
    const sql = `
            with RankedUsers as (SELECT gd."accountId",
                                        a."telegramUsername",
                                        a.address,
                                        a."firstName",
                                        a."lastName",
                                        a."photoUrl"        as avatar,
                                        (a.id = :accountId) as mine,
                SUM (coalesce(gd.point, 0)) AS point,
                RANK() OVER (ORDER BY SUM (coalesce(gd.point, 0)) DESC) as rank
            FROM game_play gd
                JOIN
                account a
            ON gd."accountId" = a.id
            where gd."createdAt" >= :startDate
              and gd."createdAt" <= :endDate
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

  getTaskQuery() {
    const sql = `
            with RankedUsers as (SELECT t."accountId",
                                        a."telegramUsername",
                                        a."firstName",
                                        a.address,
                                        a."lastName",
                                        a."photoUrl"        as avatar,
                                        (a.id = :accountId) as mine,
                SUM(coalesce(t."pointReward", 0)) AS point,
                MIN(t."createdAt") as "createdAt",
                RANK() OVER (ORDER BY SUM (coalesce(t."pointReward", 0)) DESC, MIN(t."createdAt") asc) as rank
            FROM task_history t
                JOIN
                account a
            ON t."accountId" = a.id
            where t."createdAt" >= :startDate
              and t."createdAt" <= :endDate
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

            with combinedPoints as (SELECT "sourceAccountId" AS accountId,
                                           SUM(coalesce(point, 0))        AS point
                                    FROM referral_log
                                    where "createdAt" >= :startDate
                                      and "createdAt" <= :endDate
                                    GROUP BY "sourceAccountId"
                                    UNION ALL
                                    SELECT "indirectAccount"    AS accountId,
                                           SUM(coalesce("indirectPoint", 0)) AS point
                                    FROM referral_log
                                    where "createdAt" >= :startDate
                                      and "createdAt" <= :endDate
                                    GROUP BY "indirectAccount"
                                    UNION ALL
                                    SELECT "sourceAccountId" AS accountId,
                                           SUM(coalesce(point, 0))        AS point
                                    FROM referral_upgrade_log
                                    where "createdAt" >= :startDate
                                      and "createdAt" <= :endDate
                                    GROUP BY "sourceAccountId"
                                    UNION ALL
                                    SELECT "indirectAccount"    AS accountId,
                                           SUM(coalesce("indirectPoint", 0)) AS point
                                    FROM referral_upgrade_log
                                    where "createdAt" >= :startDate
                                      and "createdAt" <= :endDate
                                    GROUP BY "indirectAccount"
                                    ),
                 rankedUsers as (SELECT accountId,
                                        RANK() OVER (ORDER BY SUM(point) DESC) as rank, SUM(point) AS point
                                 FROM combinedPoints
                                 GROUP BY accountId)
            SELECT a.id as "accountId",
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

  getAllDataQuery( gameId: number) {
    const queryGame = gameId > 0 ? 'and "gameId" = :gameId' : '';
    const sql = `
        with RankedUsers as (SELECT "sourceAccountId"       AS accountId,
                                    MIN("createdAt") as "createdAt",
                                    SUM(coalesce(point, 0)) AS point
                             FROM referral_log
                             where "createdAt" >= :startDate
                               and "createdAt" <= :endDate
                             GROUP BY "sourceAccountId"
                             UNION ALL
                             SELECT "indirectAccount"                 AS accountId,
                                    MIN("createdAt") as "createdAt",
                                    SUM(coalesce("indirectPoint", 0)) AS point
                             FROM referral_log
                             where "createdAt" >= :startDate
                               and "createdAt" <= :endDate
                             GROUP BY "indirectAccount"
                             
                            UNION ALL
                            SELECT "sourceAccountId" AS accountId,
                                   MIN("createdAt") as "createdAt",
                                   SUM(coalesce(point, 0))        AS point
                            FROM referral_upgrade_log
                            where "createdAt" >= :startDate
                              and "createdAt" <= :endDate
                            GROUP BY "sourceAccountId"
                            UNION ALL
                            SELECT "indirectAccount"    AS accountId,
                                   MIN("createdAt") as "createdAt",
                                   SUM(coalesce("indirectPoint", 0)) AS point
                            FROM referral_upgrade_log
                            where "createdAt" >= :startDate
                              and "createdAt" <= :endDate
                            GROUP BY "indirectAccount"
                            
                             UNION ALL
                             SELECT "accountId"             AS accountId,
                                    MIN("createdAt") as "createdAt",
                                    SUM(coalesce(point, 0)) AS point
                             FROM game_play
                             where "createdAt" >= :startDate
                               and "createdAt" <= :endDate
            ${queryGame}
        GROUP BY 1
        UNION ALL
        SELECT "accountId"             AS accountId,
               MIN("createdAt") as "createdAt",
               SUM(coalesce(point, 0)) AS point
        FROM giveaway_point
        where "createdAt" >= :startDate
          and "createdAt" <= :endDate
        GROUP BY 1
        UNION ALL
        SELECT "accountId"                     AS accountId,
               MIN("createdAt") as "createdAt",
               SUM(coalesce("pointReward", 0)) AS point
        FROM task_history
        where "createdAt" >= :startDate
          and "createdAt" <= :endDate
        GROUP BY 1),
             totalData as (SELECT accountId,
                                  sum(point) as point,
                                  RANK()        OVER (ORDER BY sum(point) DESC, MIN("createdAt") asc) AS rank
                           FROM RankedUsers
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
        where rank <= :limit
           or accountId = :accountId
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
                                        a."photoUrl"         as avatar,
                                        aa."accumulatePoint" as point,
                                        RANK()                  OVER (ORDER BY aa."accumulatePoint" DESC) as rank,
                                        (a.id = :accountId) as mine
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

  async getTotalLeaderboard(accountId: number, gameId: number, startDate: string, endDate: string, limit=100, typeQuery = 'all') {
    let sql = this.getAllDataQuery(gameId);
    if (typeQuery === 'game') {
      sql = this.getGameQuery(gameId);
    } else if (typeQuery === 'task') {
      sql = this.getTaskQuery();
    } else if (typeQuery === 'accumulatePoint') {
      sql = this.getAccumulatePoint();
    } else if (typeQuery === 'referral') {
      sql = this.getReferralLogQuery();
    }

    try {
      const data = await this.sequelizeService.sequelize.query<LeaderboardRecord>(sql, {
        replacements: {accountId, gameId, startDate, endDate, limit},  // Use replacements for parameterized queries
        type: QueryTypes.SELECT,
      });

      return data.map(item => ({
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
      }) as LeaderboardPerson);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [] as LeaderboardPerson[];  // Return an empty array in case of an error
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
