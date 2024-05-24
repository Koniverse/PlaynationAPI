import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import { AirdropCampaign, AirdropCampaignStatus, AirdropRecord } from '@src/models';

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

interface AirdropRecordInterface {
  accountId: number;
  token: number;
  nps: number;
  eligibilityId: number;
  campaign: AirdropCampaign;
}

export interface AirdropEligibility {
  name: string;
  userList: JSON;
  boxCount: number;
  campaign: AirdropCampaign;
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

  async createAirdropAndReward(data: AirdropEligibility[]): Promise<{ success: boolean; data: any[] }> {
    const userList: AirdropRecordInterface[] = [];
    const airDropCampaign = await AirdropCampaign.findByPk(1);
    if (!airDropCampaign) {
      throw new Error('Campaign not exist');
    }
    const tokenDistributions: Array<JSON> = JSON.parse(JSON.stringify(airDropCampaign.tokenDistributions));
    const npsDistributions: Array<JSON> = JSON.parse(JSON.stringify(airDropCampaign.npsDistributions));
    data.forEach((user: any) => {
      const dataUserList = user.userList;
      dataUserList.forEach((item: any) => {
        for (let i = 0; i < user.boxCount; i++) {
          userList.push({
            accountId: item.accountInfo.id,
            token: 0,
            nps: 0,
            eligibilityId: user.userId,
            campaign: user.airdrop_campaign_id,
          });
        }
      });
    });

    for (let i = userList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [userList[i], userList[j]] = [userList[j], userList[i]];
    }

    let currentIndex = 0;

    tokenDistributions.forEach((distribution: any) => {
      for (let i = 0; i < distribution.count; i++) {
        if (currentIndex < userList.length) {
          userList[currentIndex].token = distribution.token;
          userList[currentIndex].nps = 0;
          currentIndex++;
        }
      }
    });

    npsDistributions.forEach((distribution: any) => {
      for (let i = 0; i < distribution.count; i++) {
        if (currentIndex < userList.length) {
          userList[currentIndex].token = 0;
          userList[currentIndex].nps = distribution.nps;
          currentIndex++;
        }
      }
    });
    await this.insertAirdrop(userList);
    return {
      success: true,
      data: userList,
    };
  }

  async insertAirdrop(userList: AirdropRecordInterface[]): Promise<void> {
    // truncate airdrop record
    await AirdropRecord.truncate();
    const snapshotData: any = {};
    for (const item of userList) {
      await AirdropRecord.create({
        campaign_id: item.campaign.id,
        accountId: item.accountId,
        token: item.token,
        symbol: item.campaign.symbol,
        decimal: item.campaign.decimal,
        network: item.campaign.network,
        status: 'NEW_REGISTRATION',
        snapshot_data: snapshotData,
        point: item.nps,
      });
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
