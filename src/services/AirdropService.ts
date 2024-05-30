// Imports
import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import {
  Account,
  AIRDROP_LOG_STATUS,
  AIRDROP_LOG_TYPE,
  AirdropCampaign,
  AirdropEligibility,
  AirdropRecord,
  AirdropRecordLog,
  AirdropRecordsStatus,
} from '@src/models';
import { AirdropCampaignInterface } from '@src/models/AirdropCampaign';
import { AirdropEligibilityInterface } from '@src/models/AirdropEligibility';
import { QueryTypes } from 'sequelize';
import { CommonService } from '@src/services/CommonService';
import { AccountService } from '@src/services/AccountService';
import * as console from 'node:console';

// Interfaces
interface BoxInterface {
  accountId: number;
  token: number;
  nps: number;
  eligibilityId: number;
  airdrop_campaign: AirdropCampaign;
  campaign_id?: AirdropCampaign;
}

const commonService = CommonService.instance;
const accountService = AccountService.instance;

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
        type: item.type,
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
    const results = await this.sequelizeService.sequelize.query(
      `SELECT airdrop_campaigns.id     AS campaign_id,
              airdrop_campaigns.*,
              airdrop_eligibility.name AS eligibility_name,
              airdrop_eligibility.type AS eligibility_type
       FROM airdrop_campaigns
                LEFT JOIN airdrop_eligibility ON airdrop_campaigns.id = airdrop_eligibility.campaign_id
       WHERE airdrop_campaigns.status = 'ACTIVE';`,
      { type: QueryTypes.SELECT },
    );

    const campaigns: any = {};

    results.forEach((item: any) => {
      if (!campaigns[item.campaign_id]) {
        campaigns[item.campaign_id] = {
          campaign_id: item.campaign_id,
          name: item.name,
          icon: item.icon,
          banner: item.banner,
          start_snapshot: item.start_snapshot,
          end_snapshot: item.end_snapshot,
          start_claim: item.start_claim,
          end_claim: item.end_claim,
          network: item.network,
          total_tokens: item.total_tokens,
          symbol: item.symbol,
          decimal: item.decimal,
          method: item.method,
          start: item.start,
          end: item.end,
          description: item.description,
          token_slug: 'karura_evm-NATIVE-KAR',
          eligibilityList: [],
        };
      }

      if (item.eligibility_name && item.eligibility_type) {
        campaigns[item.campaign_id].eligibilityList.push({
          name: item.eligibility_name,
          type: item.eligibility_type,
        });
      }
    });

    return Object.values(campaigns);
  }

  async checkEligibility(account_id: number, campaign_id: number) {
    const results = await AirdropEligibility.findAll({
      where: { campaign_id },
    });

    if (!results || results.length === 0) {
      throw new Error('Campaign not found');
    }
    let eligibility = false;
    let raffleTotal = 0;
    results.forEach((item: any) => {
      const userList = JSON.parse(item.userList);
      userList.forEach((user: any) => {
        if (user.accountInfo.id === account_id) {
          eligibility = true;
          raffleTotal++;
        }
      });
    });
    return {
      eligibility: eligibility,
      raffleTotal: raffleTotal,
    };
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
              status: AirdropRecordsStatus.CLOSED,
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

  async handleRaffle(account_id: number, campaign_id: number) {
    console.log(account_id);
    const campaign = await AirdropCampaign.findByPk(campaign_id);
    const account = await Account.findByPk(account_id);
    const airdropRecord = await AirdropRecord.findOne({
      where: {
        campaign_id,
        accountId: account_id,
        status: AirdropRecordsStatus.CLOSED,
      },
    });
    if (!airdropRecord || !campaign || !account) {
      throw new Error('Record not found');
    }
    const type = airdropRecord.token > 0 ? AIRDROP_LOG_TYPE.TOKEN : AIRDROP_LOG_TYPE.NPS;
    const amount: number = airdropRecord.token > 0 ? airdropRecord.token : airdropRecord.point;
    const transaction = await this.sequelizeService.startTransaction();

    try {
      const airdropRecordLogResult = await AirdropRecordLog.create({
        name: campaign.name,
        address: account.address,
        campaign_method: campaign.method,
        type: type,
        account_id: account_id,
        network: campaign.network,
        campaign_id: campaign_id,
        decimal: airdropRecord.decimal,
        amount: amount,
        airdrop_record_id: airdropRecord.id,
        status: AIRDROP_LOG_STATUS.PENDING,
      });
      // update airdrop record status
      await airdropRecord.update({ status: AirdropRecordsStatus.OPEN }, { transaction });
      await transaction.commit();
      return {
        success: true,
        airdropRecordLogId: airdropRecordLogResult.id,
        rewardType: type,
        rewardAmount: amount,
      };
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  async handleClaim(account_id: number, airdrop_log_id: number) {
    const airdropRecordLog = await AirdropRecordLog.findByPk(airdrop_log_id);
    if (!airdropRecordLog) {
      throw new Error('Record not found');
    }
    const transaction = await this.sequelizeService.startTransaction();
    try {
      // send token to user if type is token, otherwise send NPS
      if (airdropRecordLog.type === AIRDROP_LOG_TYPE.TOKEN) {
        // send token
        const data = {
          address: airdropRecordLog.address,
          network: airdropRecordLog.network,
          decimal: airdropRecordLog.decimal,
          amount: airdropRecordLog.amount,
        };
        const transaction = await commonService.callActionChainService('chain/create-transfer', data);
        console.log(data);
        console.log(transaction);
        // save transaction log
      } else {
        // send NPS
        await accountService.addAccountPoint(account_id, airdropRecordLog.amount);
      }
      await airdropRecordLog.update({ status: AIRDROP_LOG_STATUS.RECEIVED }, { transaction });
      await transaction.commit();
      return {
        success: true,
      };
    } catch (e) {
      await transaction.rollback();
      throw e;
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
