import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import { AirdropCampaign } from '@src/models';

export interface AirdropCampaignContentCms {
  id: number;
  name: string;
  icon: string;
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
  status: string;
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
      return response;
    }
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
