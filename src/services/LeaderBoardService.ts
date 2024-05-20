import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import {LeaderboardPerson} from '@src/models';
import {QueryTypes} from 'sequelize';

export interface LeaderboardParams {
    gameId: number;
    startDate: string;
    endDate: string;
    type: 'accumulatePoint' | 'game' | 'task' | 'referral';
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

  getGameQuery() {
    const sql = `
            with RankedUsers as (SELECT gd."accountId",
                                        a."telegramUsername",
                                        a."firstName",
                                        a."lastName",
                                        a."photoUrl"        as avatar,
                                        (a.id = :accountId) as mine,
                SUM (gd.point) AS point,
                RANK() OVER (ORDER BY SUM (gd.point) DESC) as rank
            FROM game_data gd
                JOIN
                account a
            ON gd."accountId" = a.id
            where gd."createdAt" >= :startDate
              and gd."createdAt" <= :endDate
              and gd."gameId" = :gameId
            GROUP BY 1, 2, 3, 4, 5, 6
            ORDER BY rank asc)
            select *
            from RankedUsers
            where rank <= 100
               or mine = true;
        `;
    return sql;
  }

  getTaskQuery() {
    const sql = `
            with RankedUsers as (SELECT t."accountId",
                                        a."telegramUsername",
                                        a."firstName",
                                        a."lastName",
                                        a."photoUrl"        as avatar,
                                        (a.id = :accountId) as mine,
                SUM (t."pointReward") AS point,
                MIN(t."createdAt") as "createdAt",
                RANK() OVER (ORDER BY SUM (t."pointReward") DESC, MIN(t."createdAt") asc) as rank
            FROM task_history t
                JOIN
                account a
            ON t."accountId" = a.id
            where t."createdAt" >= :startDate
              and t."createdAt" <= :endDate
            GROUP BY 1, 2, 3, 4, 5, 6
            ORDER BY rank asc)
            select *
            from RankedUsers
            where rank <= 100
               or mine = true;
        `;
    return sql;
  }

  getReferralLogQuery() {
    const sql = `

            with combinedPoints as (SELECT "sourceAccountId" AS accountId,
                                           SUM(point)        AS point
                                    FROM referral_log
                                    where "createdAt" >= :startDate
                                      and "createdAt" <= :endDate
                                    GROUP BY "sourceAccountId"
                                    UNION ALL
                                    SELECT "indirectAccount"    AS accountId,
                                           SUM("indirectPoint") AS point
                                    FROM referral_log
                                    where "createdAt" >= :startDate
                                      and "createdAt" <= :endDate
                                    GROUP BY "indirectAccount"),
                 rankedUsers as (SELECT accountId,
                                        RANK() OVER (ORDER BY SUM(point) DESC) as rank, SUM(point) AS point
                                 FROM combinedPoints
                                 GROUP BY accountId)
            SELECT a.id,
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
            where ra.rank <= 100
               or a.id = :accountId
            ORDER BY point DESC;
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
            WHERE rank <= 100
               OR mine = true
            ORDER BY rank;
        `;
    return sql;
  }

  async getTotalLeaderboard(accountId: number, gameId: number, startDate: string, endDate: string, typeQuery = 'game') {
    let sql = this.getReferralLogQuery();
    if (typeQuery === 'game') {
      sql = this.getGameQuery();
    } else if (typeQuery === 'task') {
      sql = this.getTaskQuery();
    } else if (typeQuery === 'accumulatePoint') {
      sql = this.getAccumulatePoint();
    } else if (typeQuery === 'referral') {
      sql = this.getReferralLogQuery();
    }

    try {
      const data = await this.sequelizeService.sequelize.query<LeaderboardRecord>(sql, {
        replacements: {accountId, gameId, startDate, endDate},  // Use replacements for parameterized queries
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
