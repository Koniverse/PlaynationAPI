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
  AirdropTransactionLog,
  AirdropTransactionLogStatus,
} from '@src/models';
import { AirdropCampaignInterface, AirdropCampaignStatus } from '@src/models/AirdropCampaign';
import { AirdropEligibilityInterface } from '@src/models/AirdropEligibility';
import { QueryTypes, Transaction } from 'sequelize';
import { CommonService } from '@src/services/CommonService';
import { AccountService } from '@src/services/AccountService';

// Interfaces
interface BoxInterface {
  accountId: number;
  token: number;
  nps: number;
  eligibilityId: number;
  airdrop_campaign: AirdropCampaign;
  campaign_id?: AirdropCampaign;
}

interface TransactionInterface {
  extrinsicHash: string;
  blockHash: string;
  blockNumber: number;
  amount: number;
  point: number;
  error?: string;
}

const enum AirdropCampaignProcess {
  COMING_SOON = 'COMING_SOON',
  ELIGIBLE = 'ELIGIBLE',
  INELIGIBLE = 'INELIGIBLE',
  RAFFLE = 'RAFFLE',
  END_CAMPAIGN = 'END_CAMPAIGN',
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
        start: item.start,
        end: item.end,
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
    const status = AirdropCampaignStatus.ACTIVE;
    const results = await this.sequelizeService.sequelize.query(
      `SELECT airdrop_campaigns.id          AS airdrop_campaign_id,
              airdrop_campaigns.*,
              airdrop_eligibility.name      AS eligibility_name,
              airdrop_eligibility.id        AS eligibility_id,
              airdrop_eligibility.type      AS eligibility_type,
              airdrop_eligibility.start     AS eligibility_start,
              airdrop_eligibility.end       AS eligibility_end,
              airdrop_eligibility.box_count AS eligibility_box
       FROM airdrop_campaigns
                LEFT JOIN
            airdrop_eligibility
            ON
                airdrop_campaigns.id = airdrop_eligibility.campaign_id
       WHERE airdrop_campaigns.status = '${status}'
       order by airdrop_eligibility.id ASC;`,
      { type: QueryTypes.SELECT },
    );

    const campaigns: any = {};

    results.forEach((item: any) => {
      if (!campaigns[item.campaign_id]) {
        campaigns[item.campaign_id] = {
          airdrop_campaign_id: item.airdrop_campaign_id,
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
          shortDescription: item.shortDescription,
          token_slug: item.token_slug,
          eligibilityList: [],
        };
      }

      if (item.eligibility_name && item.eligibility_type) {
        campaigns[item.campaign_id].eligibilityList.push({
          id: item.eligibility_id,
          name: item.eligibility_name,
          type: item.eligibility_type,
          boxCount: item.eligibility_box,
          start: item.eligibility_start,
          end: item.eligibility_end,
          note: item.note,
        });
      }
    });

    return Object.values(campaigns);
  }

  async checkEligibility(account_id: number, campaign_id: number) {
    const airdropRecord = await AirdropRecord.findAll({
      where: {
        campaign_id,
        accountId: account_id,
      },
    });
    if (!airdropRecord || airdropRecord.length === 0) {
      return {
        eligibility: false,
        currentProcess: AirdropCampaignProcess.INELIGIBLE,
        totalBoxOpen: 0,
        totalBoxClose: 0,
        totalBox: 0,
      };
    }
    const currentProcess: string = await this.currentProcess(campaign_id);
    const airdropRecordData = JSON.parse(JSON.stringify(airdropRecord));
    const totalBox = airdropRecordData.length;
    const totalBoxOpen = airdropRecordData.filter((item: any) => item.status === AirdropRecordsStatus.OPEN).length;
    const totalBoxClose = airdropRecordData.filter((item: any) => item.status === AirdropRecordsStatus.CLOSED).length;
    const eligibilityIds = new Set<number>();
    airdropRecordData.forEach((item: any) => {
      if (item.accountId === account_id) {
        eligibilityIds.add(item.eligibilityId);
      }
    });
    const uniqueEligibilityIds = Array.from(eligibilityIds);
    return {
      eligibility: true,
      totalBoxOpen: totalBoxOpen,
      totalBoxClose: totalBoxClose,
      totalBox: totalBox,
      currentProcess: currentProcess,
      eligibilityIds: uniqueEligibilityIds,
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
            eligibilityId: eligibility.id,
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
              eligibilityId: item.eligibilityId,
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
      throw new Error('You have already opened all boxes');
    }

    const type = airdropRecord.token > 0 ? AIRDROP_LOG_TYPE.TOKEN : AIRDROP_LOG_TYPE.NPS;
    const amount: number = airdropRecord.token > 0 ? airdropRecord.token : airdropRecord.point;
    const transaction = await this.sequelizeService.startTransaction();
    // expiry date = current date + 30 day
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    try {
      const airdropRecordLogResult = await AirdropRecordLog.create({
        name: campaign.name,
        address: account.address,
        campaign_method: campaign.method,
        type: type,
        point: airdropRecord.point,
        account_id: account_id,
        network: campaign.network,
        campaign_id: campaign_id,
        decimal: airdropRecord.decimal,
        amount: amount,
        airdrop_record_id: airdropRecord.id,
        status: AIRDROP_LOG_STATUS.PENDING,
        eligibilityId: airdropRecord.id,
        expiryDate: expiryDate,
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

  async historyList(account_id: number) {
    return await AirdropRecordLog.findAll({
      where: { account_id },
    });
  }

  async handleClaim(account_id: number, airdrop_log_id: number) {
    const airdropRecordLog = await AirdropRecordLog.findOne({
      where: {
        id: airdrop_log_id,
        account_id: account_id,
        status: AIRDROP_LOG_STATUS.PENDING,
      },
    });

    if (!airdropRecordLog) {
      throw new Error('Airdrop record not found or already claimed.');
    }

    if (airdropRecordLog.expiryDate < new Date()) {
      throw new Error('This reward has expired and cannot be claimed.');
    }

    const transaction = await this.sequelizeService.startTransaction();
    try {
      if (airdropRecordLog.type === AIRDROP_LOG_TYPE.TOKEN) {
        const resultSendAirdrop = await this.sendAirdrop(airdropRecordLog, account_id, transaction);
        if (resultSendAirdrop === AIRDROP_LOG_STATUS.PENDING) {
          throw new Error('Please check your wallet address.');
        }
      } else {
        await accountService.addAccountPoint(account_id, airdropRecordLog.point);
      }
      await airdropRecordLog.update({ status: AIRDROP_LOG_STATUS.RECEIVED }, { transaction });
      await transaction.commit();

      return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Claim failed: ${error.message}`);
    }
  }

  async sendAirdrop(airdropRecordLog: AirdropRecordLog, account_id: number, transaction: Transaction): Promise<string> {
    const data = {
      address: airdropRecordLog.address,
      network: airdropRecordLog.network,
      decimal: airdropRecordLog.decimal,
      amount: airdropRecordLog.amount,
    };

    try {
      const transactionResult = await commonService.callActionChainService('chain/create-transfer', data);
      const transactionResponse = JSON.parse(JSON.stringify(transactionResult));
      const logData = {
        name: airdropRecordLog.name,
        account_id,
        amount: airdropRecordLog.amount,
        point: airdropRecordLog.point,
        status: AirdropTransactionLogStatus.SUCCESS,
        extrinsicHash: transactionResponse.extrinsicHash || '',
        blockHash: transactionResponse.blockHash || '',
        blockNumber: transactionResponse.blockNumber || 0,
        note: transactionResponse.error || '',
      };

      if (transactionResponse.error) {
        logData.status = AirdropTransactionLogStatus.FAILED;
      }

      await AirdropTransactionLog.create(logData, { transaction });

      return transactionResponse.error ? AIRDROP_LOG_STATUS.PENDING : AIRDROP_LOG_STATUS.RECEIVED;
    } catch (error) {
      await AirdropTransactionLog.create(
        {
          name: airdropRecordLog.name,
          account_id,
          amount: airdropRecordLog.amount,
          point: airdropRecordLog.point,
          status: AirdropTransactionLogStatus.FAILED,
          extrinsicHash: '',
          blockHash: '',
          blockNumber: 0,
          note: error.message,
        },
        { transaction },
      );

      return AIRDROP_LOG_STATUS.PENDING;
    }
  }

  async currentProcess(campaignId: number): Promise<AirdropCampaignProcess> {
    const campaign = await AirdropCampaign.findByPk(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    const { start, end, start_snapshot, end_snapshot, end_claim, start_claim } = campaign;
    const currentDate = Date.now();
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    const startSnapshotMs = new Date(start_snapshot).getTime();
    const endSnapshotMs = new Date(end_snapshot).getTime();
    const endClaimMs = new Date(end_claim).getTime();
    const startClaim = new Date(start_claim).getTime();

    if (currentDate < startMs) {
      return AirdropCampaignProcess.COMING_SOON;
    }
    if (currentDate > endMs) {
      return AirdropCampaignProcess.END_CAMPAIGN;
    }
    if (currentDate >= startSnapshotMs && currentDate <= endSnapshotMs) {
      return AirdropCampaignProcess.ELIGIBLE;
    }
    if (currentDate >= startClaim && currentDate <= endClaimMs) {
      return AirdropCampaignProcess.RAFFLE;
    }
    if (currentDate > endClaimMs) {
      return AirdropCampaignProcess.END_CAMPAIGN;
    }
    return AirdropCampaignProcess.ELIGIBLE;
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
