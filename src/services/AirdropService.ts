import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import { AirdropCampaign, AirdropCampaignStatus, AirdropRecord, AirdropRecordsStatus } from '@src/models';
import { AirdropCampaignInterface } from '@src/models/AirdropCampaign';

interface BoxInterface {
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

  // Synchronizes data for airdrop campaigns with the database
  async syncData(data: AirdropCampaignInterface[]) {
    const response = { success: true };
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

  // Lists all active airdrop campaigns
  async listAirdropCampaign() {
    return await AirdropCampaign.findAll({
      where: {
        status: AirdropCampaignStatus.ACTIVE,
      },
    });
  }

  // Creates a list of box eligible for airdrop based on the provided data
  private createBox(data: AirdropEligibility[]): BoxInterface[] {
    const boxList: BoxInterface[] = [];
    data.forEach((user: any) => {
      const dataUserList = user.userList;
      dataUserList.forEach((item: any) => {
        for (let i = 0; i < user.boxCount; i++) {
          boxList.push({
            accountId: item.accountInfo.id,
            token: 0,
            nps: 0,
            eligibilityId: user.userId,
            airdrop_campaign: user.airdrop_campaign_id,
          });
        }
      });
    });
    return boxList;
  }

  // Distributes tokens and NPS points to the users in the userList
  private async distributeRewards(userList: BoxInterface[], data: AirdropEligibility[]): Promise<void> {
    let currentIndex = 0;

    for (const user of data) {
      const campaignId: number = user.airdrop_campaign_id.id;
      const airDropCampaign: any = await AirdropCampaign.findByPk(campaignId);
      if (!airDropCampaign) {
        throw new Error(`Campaign with id ${user.airdrop_campaign_id} does not exist`);
      }

      // Combine token and NPS distributions into a single array of tasks
      const distributions = [
        ...airDropCampaign.tokenDistributions.map((d: any) => ({ type: 'token', value: d.token, count: d.count })),
        ...airDropCampaign.npsDistributions.map((d: any) => ({ type: 'nps', value: d.nps, count: d.count })),
      ];

      for (const distribution of distributions) {
        for (let i = 0; i < distribution.count; i++) {
          if (currentIndex < userList.length) {
            if (distribution.type === 'token') {
              userList[currentIndex].token = distribution.value;
              userList[currentIndex].nps = 0;
            } else {
              userList[currentIndex].token = 0;
              userList[currentIndex].nps = distribution.value;
            }
            currentIndex++;
          }
        }
      }
    }
  }

  // Main method to create airdrop and reward users based on provided eligibility data
  async createAirdropRecordAndDistribute(data: AirdropEligibility[]): Promise<{ success: boolean; data: any[] }> {
    const boxList = this.createBox(data);
    await this.distributeRewards(boxList, data);
    await this.insertAirdropRecord(boxList);
    return {
      success: true,
      data: boxList,
    };
  }

  // Inserts the airdrop snapshot data into the database
  async insertAirdropRecord(userList: BoxInterface[]): Promise<void> {
    await AirdropRecord.truncate();
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
      await AirdropRecord.create({
        campaign_id: airDropCampaign.id,
        accountId: item.accountId,
        token: item.token,
        status: AirdropRecordsStatus.ELIGIBLE_FOR_REWARD,
        symbol: airDropCampaign.symbol,
        decimal: airDropCampaign.decimal,
        network: airDropCampaign.network,
        snapshot_data: snapshotData,
        point: item.nps,
      });
    }
  }

  // Singleton instance
  private static _instance: AirdropService;
  public static get instance() {
    if (!this._instance) {
      this._instance = new AirdropService(SequelizeServiceImpl);
    }
    return this._instance;
  }
}
