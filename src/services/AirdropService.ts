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
import {Op, QueryTypes } from 'sequelize';
import { CommonService } from '@src/services/CommonService';
import { AccountService } from '@src/services/AccountService';
import { LeaderboardRecord } from './LeaderBoardService';
import { CacheService } from '@src/services/CacheService';
import { v4 } from 'uuid';
import logger from 'jet-logger';

// Interfaces
interface BoxInterface {
  accountId: number;
  token: number;
  nps: number;
  use_point: number;
  eligibility_id: number;
  airdrop_campaign: number;
  campaign_id?: number;
}

interface AirdropEligibilityData {
  airdrop_campaign_id: number;
  eligibility_name: string;
  eligibility_id: number;
  eligibility_type: string;
  eligibility_start: Date;
  eligibility_end: Date;
  eligibility_box: number;
}

type AirdropCampaignList = AirdropCampaign & AirdropEligibilityData;
type AirdropCampaignData = AirdropCampaign & { eligibilityList: AirdropEligibility[]
airdrop_campaign_id: number};
interface TransactionInterface {
  extrinsicHash: string;
  blockHash: string;
  blockNumber: number;
  amount: number;
  point: number;
  error?: string;
}

interface AirdropQueryHistoryData {
  airdrop_log_id: number;
  type: string;
  expiryDate: string;
  status: string;
  account_id: number;
  campaign_id: number;
  airdrop_record_id: number;
  eligibility_id: number;
  address: string;
  point: number;
  token: number;
  token_slug: string;
  network: string;
  campaign_method: string;
  campaign_name: string;
  decimal: number;
  airdrop_record_status: string;
  eligibility_name: string;
  eligibility_end: string;
}

interface AirdropHistoryData {
  status: string;
  type: string;
  rewardValue: number;
  endTime: string;
  name: string;
  tokenSlug: string;
  id: number;
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
  private airdropCampaignsData: AirdropCampaignData[] | undefined;

  // Synchronizes data for airdrop campaigns with the database
  async syncDataCampaign(data: AirdropCampaignInterface[]) {
    try {
      for (const item of data) {
        const itemData = { ...item } as unknown as AirdropCampaign;
        const existed = await AirdropCampaign.findOne({ where: {
          [Op.or]: [
            { document_id: item.documentId },
            { content_id: item.id },
          ],
        } as never });
        itemData.content_id = item.id;
        if (existed) {
          await existed.update(itemData);
        } else {
          await AirdropCampaign.create(itemData);
        }
      }
      this.airdropCampaignsData = await this.buildAirdropCampaignsData();
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
          boxPrice: item.boxPrice,
          boxLimit: item.boxLimit,
          userList: JSON.stringify(item.userList),
          type: item.type,
          start: item.start,
          end: item.end,
        } as unknown as AirdropEligibility;

        const existed = await AirdropEligibility.findOne({ where: {
          [Op.or]: [
            { document_id: item.documentId },
            { content_id: item.id },
          ],
        } as never });
        const existedCampaign = await AirdropCampaign.findOne({ where: { document_id: item.campaign_id } } as never);
        if (!existedCampaign) {
          continue;
        }
        itemData.campaign_id = existedCampaign.id;
        itemData.content_id = item.id;
        if (existed) {
          await existed.update(itemData);
        } else {
          await AirdropEligibility.create(itemData);
        }
      }
      this.airdropCampaignsData = await this.buildAirdropCampaignsData();
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false };
    }
  }

  async buildAirdropCampaignsData() {
    const status = AirdropCampaignStatus.ACTIVE;
    const results = await this.sequelizeService.sequelize.query<AirdropCampaignList>(
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
    const campaigns: AirdropCampaignData[] = [];

    results.forEach((item: AirdropCampaignList) => {
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
          } as unknown as AirdropEligibility);
        }
      } else {
        const newCampaign: AirdropCampaignData = {
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
          conditionDescription: item.conditionDescription,
          shortDescription: item.shortDescription,
          share: item.share,
          token_slug: item.token_slug,
          eligibilityList: [],
        } as unknown as AirdropCampaignData;

        if (item.eligibility_name && item.eligibility_type) {
          newCampaign.eligibilityList.push({
            id: item.eligibility_id,
            name: item.eligibility_name,
            type: item.eligibility_type,
            boxCount: item.eligibility_box,
            start: item.eligibility_start,
            end: item.eligibility_end,
            // note: item.note,
          } as unknown as AirdropEligibility);
        }

        campaigns.push(newCampaign);
      }
    });

    return campaigns;
  }

  // Lists all active airdrop campaigns
  async listAirdropCampaign() {
    if (this.airdropCampaignsData) {
      return this.airdropCampaignsData;
    } else {
      this.airdropCampaignsData = await this.buildAirdropCampaignsData();
      return this.airdropCampaignsData;
    }
  }

  async checkEligibility(account_id: number, campaign_id: number) {
    const airdropRecord = await AirdropRecord.findAll({
      where: {
        campaign_id,
        accountId: account_id,
      },
      order: [['use_point', 'ASC']],
    });

    const currentProcess = await this.detectCurrentProcess(campaign_id, airdropRecord.length);

    if (!airdropRecord || airdropRecord.length === 0) {
      return {
        eligibility: false,
        price: 0,
        currentProcess,
        totalBoxOpen: 0,
        totalBoxClose: 0,
        totalBox: 0,
      };
    }
    const airdropRecordData = JSON.parse(JSON.stringify(airdropRecord)) as AirdropRecord[];
    const totalBox = airdropRecordData.length;
    let totalBoxOpen = 0;
    let totalBoxClose = 0;
    let price: number | null = null;
    airdropRecordData.forEach((item) => {
      if (item.status === AirdropRecordsStatus.OPEN) {
        totalBoxOpen++;
      } else {
        totalBoxClose++;

        if (!price && item.use_point) {
          price = item.use_point;
        }
      }
    });
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
      price: price || 0,
      currentProcess,
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
              use_point: eligibility.boxPrice || 0,
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
  }

  async removeOldAirdropRecords(campaignId: number) {
    const existed = await AirdropRecord.findAll({
      where: { campaign_id: campaignId },
    });

    if (existed) {
      const existedIds = existed.map((item) => item.id);

      // Remove airdrop record log
      await AirdropRecordLog.destroy({
        where: { airdrop_record_id: {[Op.in] : existedIds} },
      });

      // Remove airdrop record
      await AirdropRecord.destroy({
        where: { id: {[Op.in]: existedIds} },
      });
    }
  }

  // Inserts the airdrop record data into the database
  async insertAirdropRecord(userList: BoxInterface[], campaign: AirdropCampaign): Promise<void> {
    const transaction = await this.sequelizeService.startTransaction();

    try {
      // Remove data from old campaign
      await this.removeOldAirdropRecords(campaign.id);

      // Insert new airdrop record
      for (const item of userList) {
        const snapshotData = {
          accountId: item.accountId,
          eligibility_id: item.eligibility_id,
          campaign: item.campaign_id,
        } as unknown as JSON;

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
            token_slug: campaign.token_slug,
            use_point: item.use_point,
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
      order: [['use_point', 'ASC']],
    });

    // Validate raffle status
    if (!airdropRecord || !campaign || !account) {
      throw new Error('You have already opened all boxes');
    }

    const type = airdropRecord.token > 0 ? AIRDROP_LOG_TYPE.TOKEN : AIRDROP_LOG_TYPE.NPS;
    const amount = airdropRecord.token > 0 ? airdropRecord.token : airdropRecord.point;
    const price = airdropRecord.use_point || 0;

    // Validate opened boxes
    const eligible = await AirdropEligibility.findByPk(airdropRecord.eligibility_id);
    if (!eligible) {
      throw new Error('Eligibility not found');
    }

    if (eligible.boxLimit && eligible.boxLimit > 0) {
      const openedBoxes = await AirdropRecord.count({
        where: {
          campaign_id,
          eligibility_id: airdropRecord.eligibility_id,
          status: AirdropRecordsStatus.OPEN,
        },
      });

      if (openedBoxes >= eligible.boxLimit) {
        throw new Error('The campaign has run out of gifts, be quicker next time!');
      }
    }

    // Validate time
    const now = new Date().getTime();
    const startClaimTime = new Date(campaign.start_claim).getTime();
    const endClaimTime = new Date(campaign.end_claim).getTime();

    if (now < startClaimTime || now > endClaimTime) {
      throw new Error('You need to claim in the raffle time');
    }

    // Validate remaining point
    if (price > 0) {
      const accountAtt = await accountService.getAccountAttribute(account_id);
      if (accountAtt.point < price) {
        throw new Error(`You need at least ${price} NPS open the box`);
      }

      await accountService.addAccountPoint(account_id, -price);
    }

    // End claim time + 30 days
    const expiryDate = new Date(campaign.end_claim);
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
        price,
      };
    } catch (e) {
      await airdropRecord.update({ status: AirdropRecordsStatus.CLOSED });
      if (price > 0) {
        await accountService.addAccountPoint(account_id, price);
      }
      throw e;
    }
  }

  async createAirdropTransaction(airdropLog: AirdropRecordLogAttributes): Promise<TransactionInterface> {
    const account = await Account.findByPk(airdropLog.account_id);
    if (!account) {
      throw new Error('Account not found');
    }

    const transactionData = {
      address: account.address,
      amount: airdropLog.token,
      network: airdropLog.network,
      decimal: airdropLog.decimal,
      token_slug: airdropLog.token_slug,
    };

    return await commonService.callActionChainService(
      'chain/create-transfer',
      transactionData,
    );
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
                        ac.token_slug,
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

    const firstAirdropLog = airdropRecordLogData[0];

    if (firstAirdropLog && firstAirdropLog.expiryDate < new Date()) {
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
      if (firstAirdropLog.type === AIRDROP_LOG_TYPE.TOKEN) {

        const sendToken: TransactionInterface = await this.createAirdropTransaction(firstAirdropLog);


        const sendTokenResponse = JSON.parse(JSON.stringify(sendToken)) as TransactionInterface;

        if (sendTokenResponse.error) {
          let errorMessage;

          switch (sendTokenResponse.error) {
          case SendTokenStatus.ERR_MISSING_TOKEN:
          case SendTokenStatus.ERR_INCORRECT_NETWORK:
          case SendTokenStatus.ERR_INSUFFICIENT_GAS_FEES:
            // Only rollback with known error
            await airdropRecordLog.update({ status: AIRDROP_LOG_STATUS.PENDING });
            errorMessage = 'The system is currently overloaded, please try again later.';
            break;
          case SendTokenStatus.ERR_INVALID_WALLET_ADDRESS:
            errorMessage = 'Invalid wallet address, please check again.';
            break;
          default:
            errorMessage = 'The system is currently overloaded, please try again later.';
          }

          logger.err(sendTokenResponse.error);

          throw new Error(errorMessage);
        }

        await this.insertTransactionLog(firstAirdropLog, sendTokenResponse, account_id);
        await airdropRecordLog.update({ status: AIRDROP_LOG_STATUS.RECEIVED });

        return { success: true };
      } else {
        throw new Error('NPS point is automatically added to your account.');
      }
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
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

  async detectCurrentProcess(campaignId: number, boxNumber: number) {
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
    if (currentDate >= startSnapshotMs && currentDate <= endSnapshotMs && boxNumber > 0) {
      return AirdropCampaignProcess.ELIGIBLE;
    }
    if (currentDate >= startClaim && currentDate <= endClaimMs && boxNumber > 0) {
      return AirdropCampaignProcess.RAFFLE;
    }

    return AirdropCampaignProcess.INELIGIBLE;
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
                        ac.token_slug,
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

    const airdropRecordLogData = await this.sequelizeService.sequelize.query<AirdropQueryHistoryData>(sql, {
      type: QueryTypes.SELECT,
    });
    if (!campaign_id || !airdropRecordLogData[0]) {
      return [];
    }
    const data: AirdropHistoryData[] = [];
    airdropRecordLogData.forEach((item) => {
      const endDate = item.eligibility_end;

      data.push({
        status: item.status,
        type: item.type,
        rewardValue: item.token ? item.token : item.point,
        tokenSlug: item.token_slug,
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
