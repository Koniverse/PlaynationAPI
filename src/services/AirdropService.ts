import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import { AirdropCampaign, AirdropCampaignStatus } from '@src/models';
import { QueryTypes } from 'sequelize';

export interface AirdropCampaignContentCms {
  id: number;
  name: string;
  icon: string;
  banner: string;
  start_snapshot: Date;
  end_snapshot: Date;
  start_claim: Date;
  end_claim: Date;
  eligibility_date: Date;
  network: string;
  total_tokens: number;
  symbol: string;
  decimal: number;
  method: string;
  raffle_count: number;
  eligibility_criteria: JSON;
  start: Date;
  end: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AirdropRecordInsertData {
  typeQuery: string;
  startDate: string;
  endDate: string;
  gameId: number;
  limit: number;
}

export class AirdropService {
  constructor(private sequelizeService: SequelizeService) {}

  async syncData(data: AirdropCampaignContentCms[]) {
    const response = {
      success: true,
    };
    for (const item of data) {
      const itemData = { ...item } as unknown as AirdropCampaign;
      const existed = await AirdropCampaign.findOne({ where: { id: item.id } });

      if (existed) {
        await existed.update(itemData);
      } else {
        await AirdropCampaign.create(itemData);
      }
    }
    return response;
  }

  async listAirdropCampaign() {
    return await AirdropCampaign.findAll({
      where: {
        status: AirdropCampaignStatus.ACTIVE,
      },
    });
  }

  async insertAirdropCampaign(
    accountId: number,
    gameId: number,
    startDate: string,
    endDate: string,
    limit: number,
    typeQuery: string,
  ) {
    let sql: string = '';
    if (typeQuery === 'TOP_500_LEADERBOARD') {
      sql = this.getAllDataQuery(gameId);
    }
    const data = await this.sequelizeService.sequelize.query<AirdropRecordInsertData>(sql, {
      replacements: { accountId, gameId, startDate, endDate, limit },
      type: QueryTypes.SELECT,
    });
    return data.map((item: any) => ({
      rank: parseInt(item.rank),
      accountId: item.accountId,
    }));
  }

  getAllDataQuery(gameId: number) {
    const queryGame = gameId > 0 ? 'and "gameId" = :gameId' : '';
    return `
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
  }

  // Singleton this class
  private static _instance: AirdropService;
  public static get instance() {
    if (!this._instance) {
      this._instance = new AirdropService(SequelizeServiceImpl);
    }

    return this._instance;
  }
}
