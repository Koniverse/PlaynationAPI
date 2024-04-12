import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import Account, {AccountParams} from '@src/models/Account';
import AccountAttribute, {AccountAttributeRank} from '@src/models/AccountAttribute';
import {generateRandomString, validateSignature} from '@src/utils';
import {checkWalletType} from '@src/utils/wallet';
import EnvVars from '@src/constants/EnvVars';
import rankJson from '../data/ranks.json';
import ReferralLog from '@src/models/ReferralLog';

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
  public async createAccount(info: AccountParams) {
    // Ensure the database is synchronized
    await this.sequelizeService.syncAll();

    // Check if account already exists
    const existingAccount = await this.findByAddress(info.address);
    if (existingAccount) {
      throw new Error('Account already exists');
    }

    // Transaction to ensure atomicity
    return await this.sequelizeService.sequelize.transaction(async (transaction) => {
      const newAccount = await Account.create({
        ...info,
        inviteCode: generateRandomString('',10),
        accumulatePoint: 0, // Assuming starting points is 0
        sessionTime: new Date(),
      }, { transaction });

      await AccountAttribute.create({
        accountId: newAccount.id,
        energy: EnvVars.Game.MaxEnergy,
        lastEnergyUpdated: new Date(),
        rank: AccountAttributeRank.IRON,
        point: 0,   // Assuming starting points is 0
      }, { transaction });

      return newAccount;
    });
  }

  // Sync account data with Telegram data
  public async syncAccountData(info: AccountParams, code = '') {
    const { signature, telegramUsername, address} = info;

    info.type = checkWalletType(address);
    if (!info.type) {
      throw new Error('Invalid wallet address');
    }

    const message = `Login as ${telegramUsername}`;
    const validSignature = validateSignature(address, message , signature);

    if (!validSignature) {
      // throw new Error('Invalid signature ' + message);
    }

    // Create account if not exists
    let account = await this.findByAddress(address);
    if (!account) {
      account = await this.createAccount(info);
      // Add  point from inviteCode
      await this.addInvitePoint(account.id, code);
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
  
  async addInvitePoint(accountId: number, code: string) {
    if (code) {
      const account = await Account.findOne({
        where: {
          inviteCode: code,
        },
      });

      if (account) {
        const accountAttribute = await this.getAccountAttribute(account.id, false);
        const existed = await ReferralLog.findOne({
          where: {
            accountFromId: accountId,
            accountReceiveId: account.id,
          }
        });
        if (existed){
          return;
        }
        const rank = accountAttribute.rank;
        const rankData = rankJson.find((item) => item.rank === rank);
        if (rankData) {
          const invitePoint = Number(rankData.invitePoint);
          await ReferralLog.create({
            accountFromId: accountId,
            accountReceiveId: account.id,
            point: invitePoint,
          });
          await accountAttribute.update({
            point: accountAttribute.point + invitePoint,
          });
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

    await accountAttribute.update({
      point: newPoint,
    });
  }

  async addAccumulatePoint(accountId: number) {
    const account = await Account.findByPk(accountId);
    if (!account) {
      throw new Error('Account not found');
    }
    const sql = `
      SELECT sum(point) from game_data where "accountId" = ${accountId};
    `;
    const data = await this.sequelizeService.sequelize.query(sql);
    if (data.length > 0) {
      // @ts-ignore
      const accumulatePoint = Number(data[0][0].sum);
      const rank = this.checkAccountAttributeRank(accumulatePoint);
      if (rank){
        const accountAttribute = await this.getAccountAttribute(accountId, false);
        await accountAttribute.update({rank});
      }
      await account.update({accumulatePoint});
    }
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
