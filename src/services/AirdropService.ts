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
  AirdropRecordLogAttributes,
  AirdropRecordsStatus,
  AirdropTransactionLog,
  AirdropTransactionLogStatus,
  LeaderboardPerson,
} from '@src/models';
import { AirdropCampaignInterface, AirdropCampaignStatus } from '@src/models/AirdropCampaign';
import { AirdropEligibilityInterface } from '@src/models/AirdropEligibility';
import { QueryTypes } from 'sequelize';
import { CommonService } from '@src/services/CommonService';
import { AccountService } from '@src/services/AccountService';
import { LeaderboardRecord } from './LeaderBoardService';
import { CacheService } from '@src/services/CacheService';
import { v4 } from 'uuid';

// Interfaces
interface BoxInterface {
  accountId: number;
  token: number;
  nps: number;
  eligibility_id: number;
  airdrop_campaign: number;
  campaign_id?: number;
}

interface TransactionInterface {
  extrinsicHash: string;
  blockHash: string;
  blockNumber: number;
  amount: number;
  point: number;
  error?: any;
}

const enum AirdropCampaignProcess {
  COMING_SOON = 'COMING_SOON',
  ELIGIBLE = 'ELIGIBLE',
  INELIGIBLE = 'INELIGIBLE',
  RAFFLE = 'RAFFLE',
  END_CAMPAIGN = 'END_CAMPAIGN',
}


const enum SendTokenStatus {
  ERR_MISSING_TOKEN = 'ERR_MISSING_TOKEN',
  ERR_INVALID_WALLET_ADDRESS = 'ERR_INVALID_WALLET_ADDRESS',
  ERR_INCORRECT_NETWORK = 'ERR_INCORRECT_NETWORK',
  ERR_INSUFFICIENT_GAS_FEES = 'ERR_INSUFFICIENT_GAS_FEES',
}

const commonService = CommonService.instance;
const accountService = AccountService.instance;
const cacheService = CacheService.instance;


function shuffleArray(array: any[]) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
}

// AirdropService Class
export class AirdropService {
  constructor(private sequelizeService: SequelizeService) {}

  // Synchronizes data for airdrop campaigns with the database
  async syncDataCampaign(data: AirdropCampaignInterface[]) {
    try {
      for (const item of data) {
        const itemData = { ...item } as unknown as AirdropCampaign;
        const existed = await AirdropCampaign.findOne({ where: { content_id: item.id } });
        if (existed) {
          await existed.update(itemData);
        } else {
          itemData.content_id = item.id;
          await AirdropCampaign.create(itemData);
        }
      }
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  async syncDataEligibility(data: AirdropEligibilityInterface[]) {
    try {
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

        const existed = await AirdropEligibility.findOne({
          where: { content_id: item.id },
        });
        if (existed) {
          await existed.update(itemData);
        } else {
          itemData.content_id = item.id;
          await AirdropEligibility.create(itemData);
        }
      }
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false };
    }
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
    const campaigns: any = [];

    results.forEach((item: any) => {
      const existingCampaign = campaigns.find(
        (c: { airdrop_campaign_id: any }) => c.airdrop_campaign_id === item.airdrop_campaign_id,
      );

      if (existingCampaign) {
        if (item.eligibility_name && item.eligibility_type) {
          existingCampaign.eligibilityList.push({
            id: item.eligibility_id,
            name: item.eligibility_name,
            type: item.eligibility_type,
            boxCount: item.eligibility_box,
            start: item.eligibility_start,
            end: item.eligibility_end,
            note: item.note,
          });
        }
      } else {
        const newCampaign: any = {
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

        if (item.eligibility_name && item.eligibility_type) {
          newCampaign.eligibilityList.push({
            id: item.eligibility_id,
            name: item.eligibility_name,
            type: item.eligibility_type,
            boxCount: item.eligibility_box,
            start: item.eligibility_start,
            end: item.eligibility_end,
            note: item.note,
          });
        }

        campaigns.push(newCampaign);
      }
    });

    return campaigns;
  }

  async checkEligibility(account_id: number, campaign_id: number) {
    const airdropRecord = await AirdropRecord.findAll({
      where: {
        campaign_id,
        accountId: account_id,
      },
    });
    const currentProcess: string = await this.currentProcess(campaign_id);
    if (!airdropRecord || airdropRecord.length === 0) {
      return {
        eligibility: true,
        currentProcess: currentProcess,
        totalBoxOpen: 0,
        totalBoxClose: 0,
        totalBox: 0,
      };
    }
    const airdropRecordData = JSON.parse(JSON.stringify(airdropRecord)) as AirdropRecord[];
    const totalBox = airdropRecordData.length;
    const totalBoxOpen = airdropRecordData.filter((item) => item.status === AirdropRecordsStatus.OPEN).length;
    const totalBoxClose = airdropRecordData.filter((item) => item.status === AirdropRecordsStatus.CLOSED).length;
    const eligibilityIds = new Set<number>();
    airdropRecordData.forEach((item) => {
      if (item.accountId === account_id) {
        eligibilityIds.add(item.eligibility_id);
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
    const campaign = await AirdropCampaign.findByPk(campaign_id);
    const eligibility = await AirdropEligibility.findAll({
      where: { campaign_id },
    });
    if (!eligibility || !campaign) {
      throw new Error('Eligibility or Campaign does not exist');
    }
    const boxList = this.createBox(eligibility);
    const distributions = [
      ...(campaign.tokenDistributions as unknown as  { count: number, token: number }[]).map((d) => ({ type: 'token', value: d.token, count: d.count })),
      ...(campaign.npsDistributions as unknown as  { nps: number, count: number }[]).map((d) => ({ type: 'nps', value: d.nps, count: d.count })),
    ];

    // Random sort distribution

    this.distributeRewards(boxList, campaign.tokenDistributions as unknown as  { count: number, token: number }[], campaign.npsDistributions as unknown as  { nps: number, count: number }[]);
    await this.insertAirdropRecord(boxList, campaign);
    return {
      success: true,
      data: boxList,
    };
  }

  // Creates a list of box eligible for airdrop based on the provided data
  private createBox(data: AirdropEligibility[]): BoxInterface[] {
    const boxList: BoxInterface[] = [];
    data.forEach((eligibility) => {
      // @ts-ignore
      const dataUserList = JSON.parse(eligibility.userList) as unknown as LeaderboardPerson[];
      if (dataUserList && dataUserList.length > 0) {
        dataUserList.forEach((item) => {
          for (let i = 0; i < eligibility.boxCount; i++) {
            boxList.push({
              accountId: item.accountInfo.id,
              token: 0,
              nps: 0,
              eligibility_id: eligibility.id,
              airdrop_campaign: eligibility.campaign_id,
            });
          }
        });
      }
    });
    return boxList;
  }

  // Distributes tokens and NPS points to the users in the userList
  private distributeRewards(
    boxList: BoxInterface[],
    tokenDistribution: { count: number, token: number }[],
    npsDistribution: { count: number, nps: number }[],
  ) {
    const rewardList: { token: number, nps: number }[] = [];
    const userBoxCount = {} as Record<number, {
      boxCount: number;
      token: number;
      nps: number;
    }>;

    // Generate reward from distributions
    for (const t of tokenDistribution) {
      for (let i = 0; i < t.count; i++) {
        rewardList.push({ token: t.token, nps: 0 });
      }
    }

    for (const n of npsDistribution) {
      for (let i = 0; i < n.count; i++) {
        rewardList.push({ token: 0, nps: n.nps });
      }
    }

    shuffleArray(rewardList);

    // Random pick reward to the box
    let currentIndex = 0;
    for (const box of boxList) {
      if (currentIndex < rewardList.length) {
        box.token = rewardList[currentIndex].token;
        box.nps = rewardList[currentIndex].nps;
        currentIndex++;
      }
    }

    // Random pick reward to the box this method is not working randomly
    // for (const user of eligibility) {
    //   // Combine token and NPS distributions into a single array of tasks
    //   for (const distribution of distributions) {
    //     for (let i = 0; i < distribution.count; i++) {
    //       if (currentIndex < boxList.length) {
    //         if (distribution.type === 'token') {
    //           boxList[currentIndex].token = distribution.value;
    //           boxList[currentIndex].nps = 0;
    //         } else {
    //           boxList[currentIndex].token = 0;
    //           boxList[currentIndex].nps = distribution.value;
    //         }
    //         currentIndex++;
    //       }
    //     }
    //   }
    // }
  }

  // Inserts the airdrop record data into the database
  async insertAirdropRecord(userList: BoxInterface[], campaign: AirdropCampaign): Promise<void> {
    const transaction = await this.sequelizeService.startTransaction();
    try {
      await AirdropRecord.truncate({ cascade: true });
      for (const item of userList) {
        const snapshotData: any = {
          accountId: item.accountId,
          eligibility_id: item.eligibility_id,
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
            eligibility_id: item.eligibility_id,
            point: item.nps,
          },
          { transaction },
        );
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
    // expiry date = current date + 30 day
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    try {
      const airdropRecordLogResult = await AirdropRecordLog.create({
        type: type,
        account_id: account_id,
        campaign_id: campaign_id,
        airdrop_record_id: airdropRecord.id,
        status: type === AIRDROP_LOG_TYPE.NPS ? AIRDROP_LOG_STATUS.RECEIVED : AIRDROP_LOG_STATUS.PENDING,
        eligibility_id: airdropRecord.eligibility_id,
        expiryDate: expiryDate,
      });

      // airdrop record nps
      if (type === AIRDROP_LOG_TYPE.NPS) {
        await accountService.addAccountPoint(account_id, amount);
      }

      // update airdrop record status
      await airdropRecord.update({ status: AirdropRecordsStatus.OPEN });

      return {
        success: true,
        airdropRecordLogId: airdropRecordLogResult.id,
        rewardType: type,
        rewardAmount: amount,
      };
    } catch (e) {
      await airdropRecord.update({ status: AirdropRecordsStatus.CLOSED });
      throw e;
    }
  }

  async handleClaim(account_id: number, airdrop_log_id: number) {
    const claimUniqueKey = `claim_${account_id}_${airdrop_log_id}`;
    const claimUniqueValue = v4();
    await cacheService.redisClient.set(claimUniqueKey, claimUniqueValue, { EX: 60 });

    const sql = `select arl.id    as airdrop_log_id,
                        arl.type,
                        arl."expiryDate",
                        arl.status,
                        arl.account_id,
                        arl.campaign_id,
                        arl.airdrop_record_id,
                        arl.eligibility_id,
                        a.address,
                        ar.point,
                        ar.token,
                        ac.network,
                        ac.method as campaign_method,
                        ac.name   as campaign_name,
                        ac.decimal,
                        ar.status as airdrop_record_status
                 from airdrop_record_log arl
                          left join account a on arl.account_id = a.id
                          left join airdrop_records ar on arl.airdrop_record_id = ar.id
                          left join airdrop_campaigns ac on ar.campaign_id = ac.id
                 where arl.id = ${airdrop_log_id}
                   and arl.account_id = ${account_id}
                   and arl.status = '${AIRDROP_LOG_STATUS.PENDING}'`;

    const airdropRecordLogData = (await this.sequelizeService.sequelize.query<AirdropRecordLogAttributes>(sql, {
      type: QueryTypes.SELECT,
    }));

    if (!airdropRecordLogData || !airdropRecordLogData[0]) {
      throw new Error('Airdrop record not found or already claimed.');
    }

    if (airdropRecordLogData[0] && airdropRecordLogData[0].expiryDate < new Date()) {
      throw new Error('This reward has expired and cannot be claimed.');
    }

    // Check claiming status
    const airdropRecordLog = await AirdropRecordLog.findByPk(airdrop_log_id);

    if (!airdropRecordLog) {
      throw new Error('Airdrop record not found or already claimed.');
    }

    if (airdropRecordLog.status === AIRDROP_LOG_STATUS.CLAIMING) {
      throw new Error('This reward is being claimed');
    }

    // Set claiming status
    await airdropRecordLog.update({ status: AIRDROP_LOG_STATUS.CLAIMING });

    if (await cacheService.redisClient.get(claimUniqueKey) !== claimUniqueValue) {
      throw new Error('Claim failed: Invalid claim request');
    }

    try {
      if (airdropRecordLogData[0].type === AIRDROP_LOG_TYPE.TOKEN) {
        const data = {
          address: airdropRecordLogData[0].address,
          network: airdropRecordLogData[0].network,
          decimal: airdropRecordLogData[0].decimal,
          amount: airdropRecordLogData[0].token,
        };

        const sendToken: TransactionInterface = await commonService.callActionChainService(
          'chain/create-transfer',
          data,
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const sendTokenResponse = JSON.parse(JSON.stringify(sendToken));

        if (sendTokenResponse.error) {
          let errorMessage;

          switch (sendTokenResponse.error) {
          case SendTokenStatus.ERR_MISSING_TOKEN:
          case SendTokenStatus.ERR_INCORRECT_NETWORK:
          case SendTokenStatus.ERR_INSUFFICIENT_GAS_FEES:
            errorMessage = 'The system is currently overloaded, please try again later.';
            break;
          case SendTokenStatus.ERR_INVALID_WALLET_ADDRESS:
            errorMessage = 'Invalid wallet address, please check again.';
            break;
          default:
            errorMessage = 'The system is currently overloaded, please try again later.';
          }

          throw new Error(errorMessage);
        }

        await this.insertTransactionLog(airdropRecordLogData[0], sendTokenResponse, account_id);
        await airdropRecordLog.update({ status: AIRDROP_LOG_STATUS.RECEIVED });

        return { success: true };
      } else {
        throw new Error('NPS point is automatically added to your account.');
      }
    } catch (error) {
      console.error(error);
      await airdropRecordLog.update({ status: AIRDROP_LOG_STATUS.PENDING });
      throw new Error(`Claim failed: ${error.message}`);
    }
  }

  async insertTransactionLog(
    airdropRecordLog: AirdropRecordLogAttributes,
    sendTokenResponse: TransactionInterface,
    account_id: number,
  ): Promise<string> {
    const { error, extrinsicHash, blockHash, blockNumber }: TransactionInterface = sendTokenResponse;
    const logData = {
      name: airdropRecordLog.campaign_name,
      account_id,
      amount: airdropRecordLog.token,
      point: airdropRecordLog.point,
      status: error ? AirdropTransactionLogStatus.FAILED : AirdropTransactionLogStatus.SUCCESS,
      extrinsicHash: error ? '' : extrinsicHash,
      blockHash: error ? '' : blockHash,
      blockNumber: error ? 0 : blockNumber,
      note: error ? error : '',
    };
    await AirdropTransactionLog.create(logData);
    return error ? AIRDROP_LOG_STATUS.PENDING : AIRDROP_LOG_STATUS.RECEIVED;
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
    return AirdropCampaignProcess.ELIGIBLE;
  }

  async historyList(account_id: number, campaign_id: number) {
    const sql = `select arl.id    as airdrop_log_id,
                        arl.type,
                        arl."expiryDate",
                        arl.status,
                        arl.account_id,
                        arl.campaign_id,
                        arl.airdrop_record_id,
                        arl.eligibility_id,
                        a.address,
                        ar.point,
                        ar.token,
                        ac.network,
                        ac.method as campaign_method,
                        ac.name   as campaign_name,
                        ac.decimal,
                        ar.status as airdrop_record_status,
                        ae.name   as eligibility_name,
                        ae.end    as eligibility_end
                 from airdrop_record_log arl
                          left join account a on arl.account_id = a.id
                          left join airdrop_records ar on arl.airdrop_record_id = ar.id
                          left join airdrop_campaigns ac on ar.campaign_id = ac.id
                          left join airdrop_eligibility ae on arl.eligibility_id = ae.id
                 where arl.account_id = ${account_id}
                   and arl.campaign_id = ${campaign_id}
                 order by arl.id desc`;

    const airdropRecordLogData = (await this.sequelizeService.sequelize.query(sql, {
      type: QueryTypes.SELECT,
    }));
    if (!campaign_id || !airdropRecordLogData[0]) {
      return [];
    }
    const data: any[] = [];
    airdropRecordLogData.forEach((item: any) => {
      const endDate: any = item.eligibility_end;
      data.push({
        status: item.status,
        type: item.type,
        rewardValue: item.token ? item.token : item.point,
        endTime: new Date(endDate).toString() || '',
        name: item.eligibility_name,
        id: item.airdrop_log_id,
      });
    });
    return data;
  }

  // fake data user airdrop
  async fakeDataUserAirdrop(accountRecord: number[]) {
    const sql = `SELECT ac.*,
                      aab.*,
                      ac.id as acc_id
               FROM account as ac
                        LEFT JOIN account_attribute as aab
                                  ON ac.id = aab.id
               WHERE ac.id IN (${accountRecord.join(',')})`;
    const data = await this.sequelizeService.sequelize.query<LeaderboardRecord & {acc_id: number}>(sql, {
      type: QueryTypes.SELECT,
    });

    return data.map(
      (item) =>
        ({
          rank: item.accountId,
          point: parseInt(item.point),
          mine: 0,
          accountInfo: {
            telegramUsername: item.telegramUsername,
            lastName: item.lastName,
            firstName: item.firstName,
            avatar: item.avatar,
            id: item.acc_id,
            address: item.address,
          },
        } as LeaderboardPerson),
    );
  }

  async checkBoxs(campaignId: number) {
    const eligibilityList = await AirdropEligibility.findAll({
      where: { campaign_id: campaignId },
    });
    let totalBox = 0;
    const eligibilityMap = {} as Record<number, { name: string, boxCount: number }>;
    eligibilityList.forEach((item) => {
      if (item.userList) {
        try {
          console.log(item.userList);
          // @ts-ignore
          const userList = JSON.parse(item.userList) as LeaderboardPerson[];
          totalBox += userList.length;
          if (!eligibilityMap[item.id]) {
            eligibilityMap[item.id] = {
              name: item.name,
              boxCount: userList.length,
            };
          }
        }catch (e) {
          console.error('error', e);
        }
      }
    });
    return {
      totalBox,
      eligibilityMap,
    };
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
