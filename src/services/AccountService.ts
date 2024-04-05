import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import Account, {ITelegramParams} from '@src/models/Account';
import AccountAttribute from '@src/models/AccountAttribute';
import Wallet from '@src/models/Wallet';
import {checkWalletType} from '@src/utils/wallet';

export interface AccountDetails {
  info: Account,
  attributes: AccountAttribute,
  wallets: string[],
}

export interface syncAccountInfo {
  info: ITelegramParams;
  walletAddresses: string[];
}

export class AccountService {
  constructor(private sequelizeService: SequelizeService) {}

  public async findById(id: number) {
    return await Account.findByPk(id);
  }

  // Find an account by Telegram ID
  public async findByTelegramId(telegramId: number) {
    return await Account.findOne({ where: { telegramId } });
  }

  public async fetchAccountWithDetails(id: number) {
    const account = await this.findById(id);
    const attribute = await AccountAttribute.findOne({ where: { accountId: id } });
    const wallets = await Wallet.findAll({ where: { accountId: id } });

    return {
      info: account,
      attributes: attribute,
      wallets: wallets.map((wallet) => wallet.address)
    };
  }

  // Create a new account and its attributes
  public async createAccount(info: ITelegramParams) {
    // Ensure the database is synchronized
    await this.sequelizeService.syncAll();

    // Check if account already exists
    const existingAccount = await this.findByTelegramId(info.telegramId);
    if (existingAccount) {
      throw new Error('Account already exists');
    }

    // Transaction to ensure atomicity
    return await this.sequelizeService.sequelize.transaction(async (transaction) => {
      const newAccount = await Account.create({
        ...info,
      }, { transaction });

      await AccountAttribute.create({
        accountId: newAccount.id,
        energy: 100, // Assuming starting energy is 100
        point: 0,   // Assuming starting points is 0
      }, { transaction });

      return newAccount;
    });
  }

  // Link wallet with account
  public async linkWallet(accountId: number, walletAddress: string) {
    // Ensure the database is synchronized
    await this.sequelizeService.syncAll();

    // Check if account already exists
    const account = await this.findById(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    const walletType = checkWalletType(walletAddress);
    if (!walletType) {
      throw new Error('Invalid wallet address');
    }

    // Check if wallet is already linked or exists
    let wallet = await Wallet.findOne({ where: { accountId, address: walletAddress } });

    if (!wallet) {
      wallet = await Wallet.create({
        accountId: account.id,
        address: walletAddress,
        type: walletType,
      });
    }

    return wallet;
  }

  // Sync account data with Telegram data
  public async syncAccountData({info, walletAddresses}: syncAccountInfo) {
    const {telegramId} = info;

    // Create account if not exists
    let account = await this.findByTelegramId(telegramId);
    if (!account) {
      account = await this.createAccount(info);
    }

    // Update account info if changed
    if (
      account.firstName !== info.firstName ||
        account.lastName !== info.lastName ||
        account.photoUrl !== info.photoUrl ||
        account.addedToAttachMenu !== info.addedToAttachMenu ||
        account.languageCode !== info.languageCode
    ) {
      await account.update(info);
    }

    // Update wallet addresses
    const existedWallets = await Wallet.findAll({ where: { accountId: account.id } });
    const existedAddresses = existedWallets.map((wallet) => wallet.address);
    const newAddresses = walletAddresses.filter((address) => !existedAddresses.includes(address));

    if (newAddresses.length) {
      for (const address of newAddresses) {
        existedWallets.push(await this.linkWallet(account.id, address));
      }
    }
    
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