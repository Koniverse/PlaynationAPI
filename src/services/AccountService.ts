import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import Account, {AccountParams, WalletParams} from '@src/models/Account';
import AccountAttribute from '@src/models/AccountAttribute';
import {validateSignature} from '@src/utils';
import {checkWalletType} from '@src/utils/wallet';

export interface AccountDetails {
  info: Account,
  attributes: AccountAttribute,
  wallets: string[],
}

export type syncAccountInfo = WalletParams;

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
    const attribute = await AccountAttribute.findOne({ where: { accountId: id } });

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
        sessionTime: new Date(),
      }, { transaction });

      await AccountAttribute.create({
        accountId: newAccount.id,
        energy: 100, // Assuming starting energy is 100
        point: 0,   // Assuming starting points is 0
      }, { transaction });

      return newAccount;
    });
  }

  // Sync account data with Telegram data
  public async syncAccountData(info: AccountParams) {
    const { signature, telegramUsername, address} = info;

    info.type = checkWalletType(address);
    if (!info.type) {
      throw new Error('Invalid wallet address');
    }

    const message = `Login as ${telegramUsername}`;
    const validSignature = validateSignature(address, message , signature);

    if (!validSignature) {
      throw new Error('Invalid signature ' + message);
    }

    // Create account if not exists
    let account = await this.findByAddress(address);
    if (!account) {
      account = await this.createAccount(info);
    }


    // Update account info if changed
    if (
      account.firstName !== info.firstName ||
        account.lastName !== info.lastName ||
        account.photoUrl !== info.photoUrl ||
        !!account.addedToAttachMenu !== !!info.addedToAttachMenu || // Convert to boolean
        account.languageCode !== info.languageCode
    ) {
      await account.update(info);
    }

    if (account.signature !== info.signature || account.telegramId !== info.telegramId || account.telegramUsername !== info.telegramUsername) {
      await account.update({
        ...info,
        sessionTime: new Date(),
      });
    }

    // Update wallet addresses
    return account;
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