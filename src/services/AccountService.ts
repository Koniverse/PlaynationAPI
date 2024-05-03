import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import Account, {AccountParams, ReferralRecord} from '@src/models/Account';
import AccountAttribute, {AccountAttributeRank} from '@src/models/AccountAttribute';
import {generateRandomString, validateSignature} from '@src/utils';
import {checkWalletType} from '@src/utils/wallet';
import EnvVars from '@src/constants/EnvVars';
import rankJson from '../data/ranks.json';
import ReferralLog from '@src/models/ReferralLog';
import {GiveAwayPoint} from '@src/models';
import {TelegramService} from '@src/services/TelegramService';

// CMS input
export interface GiveawayPointParams {
  contentId?: number;
  inviteCode: string;
  point: number;
  note?: string;
}

export class AccountService {
  constructor(private sequelizeService: SequelizeService) {}

  public async findById(id: number) {
    return await Account.findByPk(id);
  }

  // Find an account by Telegram ID
  public async findByAddress(address: string) {
    return await Account.findOne({ where: { address } });
  }

  public async fetchAccountWithDetails(id: number) {
    const account = await this.findById(id);
    if(account) {
      account.signature = '___';
    }
    const attribute = await this.getAccountAttribute(id);

    return {
      info: account,
      attributes: attribute,
    };
  }

  // Create a new account and its attributes
  public async createAccount(params: AccountParams) {
    const {referralCode, ...info} = params;

    // Ensure the database is synchronized
    await this.sequelizeService.syncAll();

    // Check if account already exists
    const existingAccount = await this.findByAddress(info.address);
    if (existingAccount) {
      throw new Error('Account already exists');
    }

    let inviteCode = generateRandomString();

    // eslint-disable-next-line no-constant-condition
    while(true) {
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
      point: 0,   // Assuming starting points is 0
    });

    return newAccount;

  }

  // Sync account data with Telegram data
  public async syncAccountData(info: AccountParams, code?: string, validateSign = true) {
    const { signature, telegramUsername, address} = info;

    info.type = checkWalletType(address);
    if (!info.type) {
      throw new Error('Invalid wallet address');
    }

    const message = `Login as ${telegramUsername}`;
    const validSignature = validateSignature(address, message , signature);

    if (validateSign && !validSignature) {
      throw new Error('Invalid signature ' + message);
    }

    // Create account if not exists
    let account = await this.findByAddress(address);
    if (!account) {
      account = await this.createAccount(info);
      // Add  point from inviteCode
      code && await this.addInvitePoint(account.id, code, account.isPremium);
      
      const {telegramId} = info;
      if (telegramId) {
        await TelegramService.instance.saveTelegramAccountAvatar(telegramId);
      }
    }


    // Update account info if changed
    if (
      account.firstName !== info.firstName ||
        account.lastName !== info.lastName ||
        account.photoUrl !== info.photoUrl ||
        !!account.addedToAttachMenu !== !!info.addedToAttachMenu || // Convert to boolean
        account.languageCode !== info.languageCode
    ) {
      console.log('Updating account info');
      await account.update(info);
    }

    // Update signature, telegramId, telegramUsername
    if (account.signature !== info.signature || parseInt(account.telegramId.toString()) !== info.telegramId || account.telegramUsername !== info.telegramUsername) {
      await account.update({
        ...info,
        sessionTime: new Date(),
      });
    }

    // Update wallet addresses
    return account;
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
        if (existed){
          return;
        }

        const accountAttribute = await this.getAccountAttribute(account.id, false);
        const rank = accountAttribute.rank;
        const rankData = rankJson.find((item) => item.rank === rank);
        if (rankData) {
          const invitePoint = Number(isPremium ? rankData.premiumInvitePoint : rankData.invitePoint);
          await ReferralLog.create({
            invitedAccountId: accountId,
            sourceAccountId: account.id,
            point: invitePoint,
          });

          await this.addAccountPoint(account.id, invitePoint);
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
        accountAttribute.lastEnergyUpdated = new Date(lastEnergyUpdatedTimestamp + energyToAdd * EnvVars.Game.EnergyRecoverTime * 1000);
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

  async addAccountPoint(accountId: number, point: number) {
    const accountAttribute = await this.getAccountAttribute(accountId, false);
    const newPoint = accountAttribute.point += point;
    const newAccumulatePoint = accountAttribute.accumulatePoint += point;
    const rank = this.checkAccountAttributeRank(newAccumulatePoint);

    await accountAttribute.update({
      point: newPoint,
      accumulatePoint: newAccumulatePoint,
      rank,
    });
  }

  async useAccountPoint(accountId: number, point: number) {
    const accountAttribute = await this.getAccountAttribute(accountId, false);
    const newPoint = accountAttribute.point -= point;

    if (newPoint < 0) {
      throw new Error('Not enough point');
    }

    await accountAttribute.update({
      point: newPoint,
    });
  }

  async giveAccountPoint(params: GiveawayPointParams) {
    const {contentId, inviteCode, point, note} = params;
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
      const {contentId, inviteCode, point, note} = param;
      const _contentId = contentId || 0;
      const account = await Account.findOne({
        where: {
          inviteCode,
        },
      });
      console.log('account', account);

      if (!account) {
        continue;
      }
      if (_contentId > 0) {
        const giveAwayPoint = await GiveAwayPoint.findOne({
          where: {
            contentId: _contentId,
          },
        });
        if (giveAwayPoint) {
          continue;
        }
      }
      await GiveAwayPoint.create({
        contentId: _contentId,
        accountId: account.id,
        point,
        note,
      });

      await this.addAccountPoint(account.id, point);
    }
    return {success: true};
  }

  async getReferralLog(accountId: number) {
    const sql = `
    Select
        a.id,
        a."telegramUsername",
        a."firstName",
        a."address",
        a."lastName",
        a."photoUrl",
        rl.point,
        EXTRACT(EPOCH FROM  CAST(rl."createdAt" AS timestamp)) AS referralSuccessTime
    
    from referral_log rl
         JOIN public.account a on a.id = rl."invitedAccountId" where rl."sourceAccountId" = ${accountId}
    `;
    const data = await this.sequelizeService.sequelize.query(sql);
    if (data.length > 0) {
      return data[0].map((item) => {
        // @ts-ignore
        const {point, lastName, telegramUsername, firstName, referralsuccesstime, id, photoUrl, address} = item;
        const referralSuccessTime = parseFloat(referralsuccesstime as string);

        return {
          point: point as number,
          referralSuccessTime,
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

  // update energy

  async updateAccountEnergy(accountId: number, energy: number) {
    const accountAttribute = await this.getAccountAttribute(accountId);
    await accountAttribute.update({
      energy,
    })
    return accountAttribute;
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
