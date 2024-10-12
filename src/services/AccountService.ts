import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import Account, {AccountParams, ReferralRecord, TelegramSigninParams} from '@src/models/Account';
import AccountAttribute, { AccountAttributeRank } from '@src/models/AccountAttribute';
import { generateRandomString, validateSignature } from '@src/utils';
import { checkWalletType } from '@src/utils/wallet';
import EnvVars from '@src/constants/EnvVars';
import rankJson from '../data/ranks.json';
import ReferralLog from '@src/models/ReferralLog';
import {AccountLoginLog, BrowserInfo, GameData, GiveAwayPoint} from '@src/models';
import { TelegramService } from '@src/services/TelegramService';
import ReferralUpgradeLog from '@src/models/ReferralUpgradeLog';
import { Op } from 'sequelize';
import logger from 'jet-logger';
import {AchievementService, AchievementType} from '@src/services/AchievementService';
import Bowser from 'bowser';
import {GRPCService} from '@src/services/GRPCService';
import {createHmac} from 'crypto';
import {TelegramAuthResponse__Output} from '@koniverse/telegram-bot-grpc';

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string,
  allows_write_to_pm?: boolean
}

export interface ValidateInitDataResult {
  validData: boolean
  validTime: boolean
  params?: {
    query_id: string,
    user: TelegramUser | string,
    auth_date: number,
  }
  error?: string,
}

// CMS input
export interface GiveawayPointParams {
  contentId?: number;
  inviteCode: string;
  documentId: string;
  point: number;
  note?: string;
}

export interface AccountBanedParams {
  accountId: number[];
}

export interface AccountCheckParams {
  telegramId: number;
  point?: number;
}

export interface RequestInfo {
  userIP: string;
  country: string;
  userAgent: string;
}

export interface SyncBanAccountRequest {
  accountIds: number[]
  isEnabled: boolean
}

const BOT_USERNAME = EnvVars.Telegram.BotUsername;
const INTERNAL_VALIDATE = EnvVars.Telegram.InternalValidate;
const BOT_SECRET = createHmac('sha256', 'WebAppData')
  .update(EnvVars.Telegram.Token)
  .digest();
const grpcService = GRPCService.instance;

export class AccountService {
  constructor(private sequelizeService: SequelizeService) {}

  public async findById(id: number) {
    return await Account.findByPk(id);
  }

  // Find an account by Telegram ID
  public async findByAddress(address: string) {
    return await Account.findOne({ where: { address } });
  }

  // Find an account by Telegram ID
  public async findByTelegramId(telegramId: number) {
    // Prefer enabled account
    return await Account.findOne({ where: { telegramId }, order: [['isEnabled', 'DESC'], ['id', 'ASC']] });
  }

  public async fetchAccountWithDetails(id: number) {
    const account = await this.findById(id);
    if (account) {
      account.signature = '___';
    }
    const attribute = await this.getAccountAttribute(id);
    const gameData = await GameData.findAll({
      where: {
        accountId: account?.id || 0,
      },
    });

    return {
      info: account,
      attributes: attribute,
      gameData,
    };
  }

  // Create a new account and its attributes
  public async createAccount(params: AccountParams) {
    const { referralCode, ...info } = params;

    // Ensure the database is synchronized
    await this.sequelizeService.syncAll();

    // Check if account already exists
    const existingAccount = await this.findByAddress(info.address);
    if (existingAccount) {
      throw new Error('Account already exists');
    }

    let inviteCode = generateRandomString();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existed = await Account.findOne({
        where: {
          inviteCode,
        },
      });
      if (!existed) {
        break;
      }
      inviteCode = generateRandomString();
    }

    const newAccount = await Account.create({
      ...info,
      inviteCode,
      sessionTime: new Date(),
    });

    await AccountAttribute.create({
      accountId: newAccount.id,
      energy: EnvVars.Game.MaxEnergy,
      lastEnergyUpdated: new Date(),
      rank: AccountAttributeRank.IRON,
      accumulatePoint: 0, // Assuming starting points is 0
      point: 0, // Assuming starting points is 0
    });

    return newAccount;
  }

  public async checkPointByTelegramId({telegramId, point}: AccountCheckParams) {
    if (!telegramId) {
      throw new Error('Invalid telegramId');
    }
    const account = await Account.findAll({
      where: {
        telegramId,
        isEnabled: true,
      },
    });

    if (account.length === 0) {
      throw new Error('Account not found');
    }

    const accountAttribute = await AccountAttribute.findOne({
      where: {
        accountId: {
          [Op.in]: account.map((a) => a.id),
        },
        accumulatePoint: {
          [Op.gte]: point || 0,
        },
      },
      order: [['point', 'DESC']],
    });

    return {
      telegramId,
      enoughPoint: !!accountAttribute,
    };
  }

  // Sync account data with Telegram data
  // Deprecated: Use telegramSignIn instead
  public async syncAccountData(info: AccountParams, code?: string, accountIp='', country='', userAgent='', validateSign = true) {
    const { signature, telegramId, telegramUsername, address } = info;

    info.type = checkWalletType(address);
    if (!info.type) {
      throw new Error('Invalid wallet address');
    }

    const message = `Login with telegram id: ${telegramId}`;
    const messageOld = `Login as ${telegramUsername}`;
    const validSignature = validateSignature(address, message, signature) || validateSignature(address, messageOld, signature);

    if (validateSign && !validSignature) {
      throw new Error('Invalid signature ' + message);
    }

    // Create account if not exists
    let account = await this.findByAddress(address);
    if (!account) {
      account = await this.createAccount(info);
      // Add  point from inviteCode
      code && (await this.addInvitePoint(account.id, code, account.isPremium));

      const { telegramId } = info;
      if (telegramId) {
        await TelegramService.instance.saveTelegramAccountAvatar(telegramId);
      }
    }
    if (account && !account.isEnabled) {
      throw new Error('ACCOUNT_BANNED');
    }
    // Update account info if changed
    if (
      account.firstName !== info.firstName ||
      account.lastName !== info.lastName ||
      account.languageCode !== info.languageCode
    ) {
      logger.info('Updating account info');
      await account.update(info);
    }

    // Update signature, telegramId, telegramUsername
    if (
      account.signature !== info.signature ||
      parseInt(account.telegramId.toString()) !== info.telegramId ||
      account.telegramUsername !== info.telegramUsername
    ) {
      await account.update({
        ...info,
        sessionTime: new Date(),
      });
    }
    this.addLoginLog(account.id, accountIp, country, userAgent).catch(logger.err);

    // Update wallet addresses
    return account;
  }
  
  public async telegramLogIn({ initData, address, referralCode }: TelegramSigninParams, requestInfo: RequestInfo) {
    const walletType = checkWalletType(address);
    if (!walletType) {
      throw new Error('Invalid wallet address');
    }

    // Validate user data login from init data
    const validateData = INTERNAL_VALIDATE ? this.validateInitData(initData) : await grpcService.validateTelegramInitData(initData, BOT_USERNAME);

    if (!validateData.validData || !validateData.validTime || !validateData.params?.telegramUser) {
      throw new Error('Invalid telegram data');
    }

    const user = validateData.params.telegramUser;
    const info: AccountParams = {
      telegramId: parseInt(user.id, 10),
      telegramUsername: user.username || '',
      firstName: user.firstName,
      lastName: user.lastName,
      address,
      isBot: false,
      isPremium: false, // Todo: Check premium user with unsaved data
      languageCode: user.languageCode,
      photoUrl: '',
      referralCode,
      signature: '',
    };

    // Create account if not exists
    let account = await this.findByTelegramId(info.telegramId);

    // Check account banned
    if (account && !account.isEnabled) {
      throw new Error('ACCOUNT_BANNED');
    } else if (!account) {
      // Create account if not exists
      account = await this.createAccount(info);

      // Add  point from inviteCode
      referralCode && (await this.addInvitePoint(account.id, referralCode, account.isPremium));

      await TelegramService.instance.saveTelegramAccountAvatar(info.telegramId);
    }

    // Update account info if changed
    if (
      account.telegramUsername !== info.telegramUsername ||
      account.firstName !== info.firstName ||
      account.lastName !== info.lastName ||
      account.isPremium !== info.isPremium||
      account.languageCode !== info.languageCode||
      account.address !== info.address // Todo: Consider update address or not?
    ) {
      logger.info('Updating account info');
      await account.update(info);
    }

    // Update signature, telegramId, telegramUsername
    this.addLoginLog(account.id, requestInfo.userIP, requestInfo.country, requestInfo.userAgent).catch(logger.err);

    // Update wallet addresses
    return account;
  }
  
  async addLoginLog(accountId: number, ip: string, country: string, userAgent: string) {
    // Save info account login daily
    const account = await this.findById(accountId);
    if (!account) {
      throw new Error('Account not found');
    }
    const now = new Date();
    const today = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    // Check daily login
    const dailyLogin = await AccountLoginLog.findOne({
      where: {
        accountId,
        loginDate: today,
      },
    });
    if (!dailyLogin) {
      AchievementService.instance.triggerAchievement(account.id, AchievementType.LOGIN).catch(logger.err);
      logger.info('New daily login => trigger achievement');
    }

    // Create login log
    // TODO: Issue-137 | Add login token, startTime, endTime => user ping to save user online time
    await AccountLoginLog.create({
      accountId,
      loginDate: today,
      ip,
      country,
      browserInfo: Bowser.parse(userAgent) as BrowserInfo,
    });
  }

  checkAccountAttributeRank(accumulatePoint: number) {
    const rankData = rankJson.find((rank) => accumulatePoint >= rank.minPoint && accumulatePoint <= rank.maxPoint);
    if (!rankData && accumulatePoint > 100000000) {
      return AccountAttributeRank.DIAMOND;
    }
    if (rankData) {
      return rankData.rank as AccountAttributeRank;
    }
    return AccountAttributeRank.IRON;
  }

  async addInvitePoint(accountId: number, code: string, isPremium = false) {
    if (code) {
      const account = await Account.findOne({
        where: {
          inviteCode: code,
        },
      });

      if (account) {
        const existed = await ReferralLog.findOne({
          where: {
            invitedAccountId: accountId,
            sourceAccountId: account.id,
          },
        });
        if (existed) {
          return;
        }
        const rankData = rankJson.find((item) => item.rank === AccountAttributeRank.IRON);
        if (rankData) {
          // Check log invite from this account
          const referralLogIndirect = await ReferralLog.findOne({
            where: {
              invitedAccountId: account.id,
            },
          });

          const invitePoint = Number(isPremium ? rankData.premiumInvitePoint : rankData.invitePoint);
          let indirectAccount = 0;
          let indirectPoint = 0;
          const invitePointRecipient = 0;
          let accountInvited = null;
          if (referralLogIndirect) {
            accountInvited = await this.findById(referralLogIndirect.sourceAccountId);
            if (accountInvited) {
              indirectAccount = referralLogIndirect.sourceAccountId;
              indirectPoint = invitePoint * EnvVars.INDIRECT_POINT_RATE;
            }
          }
          // Add point to account
          await ReferralLog.create({
            invitedAccountId: accountId,
            sourceAccountId: account.id,
            point: invitePoint,
            indirectAccount,
            indirectPoint,
            invitePoint: invitePointRecipient,
            receiverInviteRatio: 0,
          });
          
          AchievementService.instance.triggerAchievement(account.id, AchievementType.REFERRAL).catch(console.error);
          AchievementService.instance.triggerAchievement(indirectAccount, AchievementType.REFERRAL).catch(console.error);
          logger.info('Call trigger Achievement');

          await this.addAccountPoint(account.id, invitePoint);
          if (indirectAccount > 0) {
            await this.addAccountPoint(indirectAccount, indirectPoint);
          }
        }
      }
    }
  }

  async getAccountAttribute(accountId: number, autoCheckEnergy = true) {
    const accountAttribute = await AccountAttribute.findOne({
      where: {
        accountId,
      },
    });

    if (!accountAttribute) {
      throw new Error('Account not found');
    }
    // Auto recover energy
    const maxEnergy = EnvVars.Game.MaxEnergy;
    if (autoCheckEnergy && accountAttribute.energy < maxEnergy) {
      const now = new Date();
      const lastEnergyUpdatedTimestamp = accountAttribute.lastEnergyUpdated.getTime();
      const diff = now.getTime() - lastEnergyUpdatedTimestamp;
      const diffInSeconds = diff / 1000;

      const energyToAdd = Math.floor(diffInSeconds / EnvVars.Game.EnergyRecoverTime);
      const energy = Math.min(accountAttribute.energy + energyToAdd, maxEnergy);

      if (energy === maxEnergy) {
        await accountAttribute.update({
          energy: maxEnergy,
          lastEnergyUpdated: now,
        });
      } else {
        accountAttribute.energy = energy;
        accountAttribute.lastEnergyUpdated = new Date(
          lastEnergyUpdatedTimestamp + energyToAdd * EnvVars.Game.EnergyRecoverTime * 1000,
        );
      }
    }

    return accountAttribute;
  }

  async useAccountEnergy(accountId: number, energy: number) {
    const accountAttribute = await this.getAccountAttribute(accountId);

    if (accountAttribute.energy < energy) {
      throw new Error('Not enough energy');
    }

    const newEnergy = accountAttribute.energy - energy;

    await accountAttribute.update({
      energy: newEnergy,
      lastEnergyUpdated: new Date(),
    });
  }

  async updateIndirectAccountPoint(accountId: number, rank: AccountAttributeRank) {
    // Find the account attribute for the given account
    const referralLog = await ReferralLog.findOne({
      where: {
        invitedAccountId: accountId,
      },
    });

    if (!referralLog) {
      return;
    }
    const account = await this.findById(accountId);
    if (!account) {
      return;
    }
    const rankData = rankJson.find((item) => item.rank === rank);
    if (rankData) {
      const invitePoint = Number(account.isPremium ? rankData.premiumInvitePoint : rankData.invitePoint);
      const indirectPoint = invitePoint * EnvVars.INDIRECT_POINT_RATE;
      const indirectAccount = referralLog.indirectAccount;

      await this.addAccountPoint(referralLog.sourceAccountId, invitePoint);
      if (indirectAccount > 0) {
        await this.addAccountPoint(indirectAccount, indirectPoint);
      }
      ReferralUpgradeLog.create({
        referralLogId: referralLog.id,
        sourceAccountId: referralLog.sourceAccountId,
        indirectAccount,
        indirectPoint: indirectAccount > 0 ? indirectPoint : 0,
        invitedAccountId: referralLog.invitedAccountId,
        point: invitePoint,
        rank,
      });
    }
  }

  async addAccountPoint(accountId: number, point: number) {
    const accountAttribute = await this.getAccountAttribute(accountId, false);
    const newPoint = (accountAttribute.point += point);

    // Only add accumulate point if point is positive
    if (point > 0) {
      const newAccumulatePoint = (accountAttribute.accumulatePoint += point);
      const rank = this.checkAccountAttributeRank(newAccumulatePoint);

      // Update indirect account point
      if (accountAttribute.rank !== rank) {
        await this.updateIndirectAccountPoint(accountId, rank);
      }

      await accountAttribute.update({
        point: newPoint,
        accumulatePoint: newAccumulatePoint,
        rank,
      });
    } else {
      // Update point only
      await accountAttribute.update({
        point: newPoint,
      });
    }
  }

  async minusAccountPoint(accountId: number, point: number) {
    const accountAttribute = await this.getAccountAttribute(accountId, false);
    const newPoint = (accountAttribute.point -= point);
    const newAccumulatePoint = (accountAttribute.accumulatePoint -= point);

    await accountAttribute.update({
      point: newPoint,
      accumulatePoint: newAccumulatePoint,
    });
  }

  async useAccountPoint(accountId: number, point: number) {
    const accountAttribute = await this.getAccountAttribute(accountId, false);
    const newPoint = (accountAttribute.point -= point);

    if (newPoint < 0) {
      throw new Error('Not enough point');
    }

    await accountAttribute.update({
      point: newPoint,
    });
  }

  async giveAccountPoint(params: GiveawayPointParams) {
    const { contentId, inviteCode, point, note } = params;
    // Find account by invite code
    const account = await Account.findOne({
      where: {
        inviteCode,
      },
    });

    if (!account) {
      throw new Error('Invalid invite code');
    }

    await GiveAwayPoint.create({
      contentId,
      accountId: account.id,
      point,
      note,
    });

    await this.addAccountPoint(account.id, point);
  }

  async syncGiveAccountPoint(params: GiveawayPointParams[]) {
    for (const param of params) {
      const { contentId, inviteCode, point, note, documentId } = param;
      const _contentId = contentId || 0;
      const account = await Account.findOne({
        where: {
          inviteCode,
        },
      });

      if (!account) {
        continue;
      }
      if (_contentId > 0) {
        const giveAwayPoint = await GiveAwayPoint.findOne({ where: { documentId: documentId }});
        if (giveAwayPoint) {
          continue;
        }
      }
      await GiveAwayPoint.create({
        contentId: _contentId,
        accountId: account.id,
        documentId: documentId,
        point,
        note,
      });

      await this.addAccountPoint(account.id, point);
    }
    return { success: true };
  }

  async addEnergy(accountId: number, energy: number) {
    const accountAttribute = await this.getAccountAttribute(accountId, false);
    const newEnergy = (accountAttribute.energy += energy);
    await accountAttribute.update({
      energy: newEnergy,
    });
  }

  async getReferralLog(accountId: number) {
    const sql = `
        SELECT (SELECT COUNT(*)
                FROM referral_log rl
                         JOIN public.account a on a.id = rl."invitedAccountId"
                WHERE rl."sourceAccountId" = ${accountId})           AS total_count,
               a.id,
               a."telegramUsername",
               a."firstName",
               a."address",
               a."lastName",
               a."photoUrl",
               rl.point,
               EXTRACT(EPOCH FROM CAST(rl."createdAt" AS timestamp)) AS referralSuccessTime
        FROM referral_log rl
                 JOIN public.account a on a.id = rl."invitedAccountId"
        WHERE rl."sourceAccountId" = ${accountId}
        LIMIT 100;
    `;
    const data = await this.sequelizeService.sequelize.query(sql);
    if (data.length > 0) {
      return data[0].map((item) => {
        // @ts-ignore
        const {
          point,
          lastName,
          telegramUsername,
          firstName,
          referralsuccesstime,
          id,
          photoUrl,
          address,
          total_count,
        }: any = item;
        const referralSuccessTime = parseFloat(referralsuccesstime as string);

        return {
          point: point as number,
          referralSuccessTime,
          total_count: total_count as number,
          accountInfo: {
            firstName: firstName as string,
            id: id as number,
            lastName: lastName as string,
            telegramUsername: telegramUsername as string,
            avatar: photoUrl as string,
            address: address as string,
          },
        } as ReferralRecord;
      });
    }
    return [];
  }

  // handle baned user
  async handleBanedAccount(data: SyncBanAccountRequest[]) {
    const transaction = await this.sequelizeService.sequelize.transaction();
    try {
      for (const item of data) {
        const accountIds = item.accountIds;
        const isEnabled = item.isEnabled;
        if (accountIds.length > 0) {
          const accounts = await Account.findAll({
            where: {
              id: {
                [Op.in]: accountIds,
              },
            },
          });
          if (accounts.length > 0) {
            await Account.update(
              {
                isEnabled,
              },
              {
                where: {
                  id: {
                    [Op.in]: accountIds,
                  },
                },
                transaction,
              },
            );
          }
        }
      }
      await transaction.commit();
      return { success: true };
    } catch (e) {
      await transaction.rollback();
      logger.info('Error in handle baned account');
    }
  }

  // update energy

  async updateAccountEnergy(accountId: number, energy: number) {
    const accountAttribute = await this.getAccountAttribute(accountId);
    await accountAttribute.update({
      energy,
    });
    return accountAttribute;
  }
  
  validateInitData(initData: string): TelegramAuthResponse__Output {
    const result = {
      validData: false,
      validTime: false,
    } as ValidateInitDataResult;

    try {
      // This token re-create every time the pop-up is re-opened except reload the page => don't need to cache
      // Step 1: Parse the initData string
      const params = new URLSearchParams(initData);
      const receivedHash = params.get('hash');
      params.delete('hash');

      // Step 2: Create the data_check_string
      const dataCheckString = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      // Step 3: Generate the HMAC-SHA-256 signature of the data_check_string
      const generatedHash = createHmac('sha256', BOT_SECRET)
        .update(dataCheckString)
        .digest('hex');

      // Step 4: Compare the generated signature with the received hash
      result.validData = generatedHash === receivedHash;
      if (!result.validData) {
        return result as TelegramAuthResponse__Output;
      }

      // Step 5: Extract the params data
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      result.params = Object.fromEntries(params.entries()) as any;
      // @ts-ignore
      if (typeof result.params.user === 'string') {
        // @ts-ignore
        result.params.user = JSON.parse(result.params.user) as TelegramUser;
      }

      // Step 6: Optionally, check the auth_date to ensure the data is not outdated
      const authDate = parseInt(params.get('auth_date') || '0', 10);
      const currentTime = Math.floor(Date.now() / 1000);
      const maxAge = 86400; // 24 hours
      result.validTime = (currentTime - authDate) < maxAge;
    } catch (error) {
      logger.err(error);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      result.error = error.message;
    }

    return {
      validData: result.validData,
      validTime: result.validTime,
      error: result.error,
      params: {
        queryId: result.params?.query_id,
        telegramUser: result.params?.user,
        authDate: result.params?.auth_date,
      },
    } as unknown as TelegramAuthResponse__Output;
  }


  // Singleton this class
  private static _instance: AccountService;
  public static get instance() {
    if (!this._instance) {
      this._instance = new AccountService(SequelizeServiceImpl);
    }

    return this._instance;
  }
}
