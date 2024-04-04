import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import Account, {ITelegramParams} from '@src/models/Account';
import AccountAttribute from '@src/models/AccountAttribute';

export class AccountService {
  constructor(private sequelizeService: SequelizeService) {}

  // Find an account by Telegram ID
  public async findByTelegramId(telegramId: number) {
    return await Account.findOne({ where: { telegramId } });
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
        accountId: newAccount,
        energy: 100, // Assuming starting energy is 100
        point: 0,   // Assuming starting points is 0
      }, { transaction });

      return newAccount;
    });
  }

  // Update account energy and points
  public async updateAccountAttributes(accountId: number, energy: number, points: number) {
    const attributes = await AccountAttribute.findOne({ where: { accountId } });
    if (!attributes) {
      throw new Error('Account attributes not found');
    }

    attributes.energy = energy;
    attributes.point = points;
    await attributes.save();
  }

  // Other account-related logic goes here...
}

export const AccountServiceImpl = new AccountService(SequelizeServiceImpl);