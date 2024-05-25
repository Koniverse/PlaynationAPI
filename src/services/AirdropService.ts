import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import { AirdropCampaign, AirdropCampaignStatus, AirdropSnapshot } from '@src/models';
import { AirdropCampaignInterface } from '@src/models/AirdropCampaign';

interface AirdropRecordInterface {
  accountId: number;
  token: number;
  nps: number;
  eligibilityId: number;
  airdrop_campaign: AirdropCampaign;
  airdrop_campaign_id?: AirdropCampaign;
}

export interface AirdropEligibility {
  airdrop_campaign: AirdropCampaign;
  airdrop_campaign_id: AirdropCampaign;
  userId: number;
  name: string;
  userList: JSON;
  boxCount: number;
}

export class AirdropService {
  constructor(private sequelizeService: SequelizeService) {}

  async syncData(data: AirdropCampaignInterface[]) {
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
    data.forEach((user: any) => {
      const dataUserList = user.userList;
      dataUserList.forEach((item: any) => {
        for (let i = 0; i < user.boxCount; i++) {
          userList.push({
            accountId: item.accountInfo.id,
            token: 0,
            nps: 0,
            eligibilityId: user.userId,
            airdrop_campaign: user.airdrop_campaign_id,
          });
        }
      });
    });
    for (let i = userList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [userList[i], userList[j]] = [userList[j], userList[i]];
    }
    let currentIndex = 0;

    for (const user of data) {
      const campaignId: number = user.airdrop_campaign_id.id;
      const airDropCampaign: any = await AirdropCampaign.findByPk(campaignId);
      if (!airDropCampaign) {
        throw new Error(`Campaign with id ${user.airdrop_campaign} does not exist`);
      }
      const tokenDistributions: Array<{
        token: number;
        count: number;
      }> = JSON.parse(JSON.stringify(airDropCampaign.tokenDistributions));
      const npsDistributions: Array<{
        nps: number;
        count: number;
      }> = JSON.parse(JSON.stringify(airDropCampaign.npsDistributions));
      for (const distribution of tokenDistributions) {
        for (let i = 0; i < distribution.count; i++) {
          if (currentIndex < userList.length) {
            userList[currentIndex].token = distribution.token;
            userList[currentIndex].nps = 0;
            currentIndex++;
          }
        }
      }
      for (const distribution of npsDistributions) {
        for (let i = 0; i < distribution.count; i++) {
          if (currentIndex < userList.length) {
            userList[currentIndex].token = 0;
            userList[currentIndex].nps = distribution.nps;
            currentIndex++;
          }
        }
      }
    }
    await this.insertAirdropSnapshot(userList);
    return {
      success: true,
      data: userList,
    };
  }

  async insertAirdropSnapshot(userList: AirdropRecordInterface[]): Promise<void> {
    await AirdropSnapshot.truncate();
    for (const item of userList) {
      const airDropCampaign: any = await AirdropCampaign.findByPk(item.airdrop_campaign.id);
      if (!airDropCampaign) {
        throw new Error(`Campaign  does not exist`);
      }
      const snapshotData: any = {
        accountId: item.accountId,
        eligibilityId: item.eligibilityId,
        campaign: item.airdrop_campaign_id,
      };
      await AirdropSnapshot.create({
        campaign_id: airDropCampaign.id,
        accountId: item.accountId,
        token: item.token,
        symbol: airDropCampaign.symbol,
        decimal: airDropCampaign.decimal,
        network: airDropCampaign.network,
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
