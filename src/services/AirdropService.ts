// Imports
import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import {
  AirdropCampaign,
  AirdropCampaignStatus,
  AirdropEligibility,
  AirdropRecord,
  AirdropRecordsStatus,
} from '@src/models';
import { AirdropCampaignInterface } from '@src/models/AirdropCampaign';
import { AirdropEligibilityInterface } from '@src/models/AirdropEligibility';

// Interfaces
interface BoxInterface {
  accountId: number;
  token: number;
  nps: number;
  eligibilityId: number;
  airdrop_campaign: AirdropCampaign;
  campaign_id?: AirdropCampaign;
}

// AirdropService Class
export class AirdropService {
  constructor(private sequelizeService: SequelizeService) {}

  // Synchronizes data for airdrop campaigns with the database
  async syncDataCampaign(data: AirdropCampaignInterface[]) {
    const response = { success: true };
    for (const item of data) {
      const itemData = { ...item } as unknown as AirdropCampaign;
      const existed = await AirdropCampaign.findByPk(item.id);
      if (existed) {
        await existed.update(itemData);
      } else {
        await AirdropCampaign.create(itemData);
      }
    }
    return response;
  }

  async syncDataEligibility(data: AirdropEligibilityInterface[]) {
    const response = { success: true };
    for (const item of data) {
      const itemData = {
        name: item.name,
        boxCount: item.boxCount,
        userList: JSON.stringify(item.userList),
        campaign_id: item.campaign_id.id,
      } as unknown as AirdropEligibility;
      const existed = await AirdropEligibility.findByPk(item.id);
      if (existed) {
        await existed.update(itemData);
      } else {
        await AirdropEligibility.create(itemData);
      }
    }
    return response;
  }

  // Lists all active airdrop campaigns
  async listAirdropCampaign() {
    try {
      const sql = `SELECT *
                   FROM airdrop_campaigns
                            left join airdrop_eligibility on airdrop_campaigns.id = airdrop_eligibility.campaign_id
                   WHERE status = '${AirdropCampaignStatus.ACTIVE}'`;

      const campaigns = await this.sequelizeService.sequelize.query(sql);
      return campaigns;
    } catch (error) {
      console.error('Error listing airdrop campaigns:', error);
      throw error;
    }
  }

  // Main method to create airdrop and reward users based on provided eligibility data
  async generateAirdropRecordAndDistribute(campaign_id: number): Promise<{
    success: boolean;
    data: any[];
  }> {
    const campaign: any = await AirdropCampaign.findByPk(campaign_id);
    const eligibility = await AirdropEligibility.findAll({
      where: { campaign_id },
    });
    if (!eligibility || !campaign) {
      throw new Error(`Eligibility or Campaign does not exist`);
    }
    const boxList = this.createBox(eligibility);
    const distributions = [
      ...campaign.tokenDistributions.map((d: any) => ({ type: 'token', value: d.token, count: d.count })),
      ...campaign.npsDistributions.map((d: any) => ({ type: 'nps', value: d.nps, count: d.count })),
    ];
    await this.distributeRewards(boxList, eligibility, distributions);
    await this.insertAirdropRecord(boxList, campaign);
    return {
      success: true,
      data: boxList,
    };
  }

  // Creates a list of box eligible for airdrop based on the provided data
  private createBox(data: AirdropEligibility[]): BoxInterface[] {
    const boxList: BoxInterface[] = [];
    data.forEach((eligibility: any) => {
      const dataUserList = JSON.parse(eligibility.userList);
      dataUserList.forEach((item: any) => {
        for (let i = 0; i < eligibility.boxCount; i++) {
          boxList.push({
            accountId: item.accountInfo.id,
            token: 0,
            nps: 0,
            eligibilityId: eligibility.userId,
            airdrop_campaign: eligibility.campaign_id,
          });
        }
      });
    });
    return boxList;
  }

  // Distributes tokens and NPS points to the users in the userList
  private async distributeRewards(
    boxList: BoxInterface[],
    eligibility: AirdropEligibility[],
    distributions: any,
  ): Promise<void> {
    let currentIndex = 0;

    for (const user of eligibility) {
      // Combine token and NPS distributions into a single array of tasks
      for (const distribution of distributions) {
        for (let i = 0; i < distribution.count; i++) {
          if (currentIndex < boxList.length) {
            if (distribution.type === 'token') {
              boxList[currentIndex].token = distribution.value;
              boxList[currentIndex].nps = 0;
            } else {
              boxList[currentIndex].token = 0;
              boxList[currentIndex].nps = distribution.value;
            }
            currentIndex++;
          }
        }
      }
    }
  }

  // Inserts the airdrop record data into the database
  async insertAirdropRecord(userList: BoxInterface[], campaign: AirdropCampaign): Promise<void> {
    const transaction = await this.sequelizeService.startTransaction();
    try {
      for (const item of userList) {
        const existingRecord = await AirdropRecord.findOne({
          where: {
            campaign_id: campaign.id,
            accountId: item.accountId,
          },
        });

        if (!existingRecord) {
          const snapshotData: any = {
            accountId: item.accountId,
            eligibilityId: item.eligibilityId,
            campaign: item.campaign_id,
          };
          await AirdropRecord.create(
            {
              campaign_id: campaign.id,
              accountId: item.accountId,
              token: item.token,
              status: AirdropRecordsStatus.ELIGIBLE_FOR_REWARD,
              symbol: campaign.symbol,
              decimal: campaign.decimal,
              network: campaign.network,
              snapshot_data: snapshotData,
              point: item.nps,
            },
            { transaction },
          );
        }
      }
      // Commit the transaction
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
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
