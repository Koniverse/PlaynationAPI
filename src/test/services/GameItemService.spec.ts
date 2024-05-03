import {AccountService} from '@src/services/AccountService';
import {AccountParams} from '@src/models/Account';
import {AccountAttribute, Receipt} from '@src/models';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {GameItemService} from '@src/services/GameItemService';
import EnvVars from '@src/constants/EnvVars';
import {Op} from 'sequelize';


describe('Game Item Test', () => {
  const accountService = AccountService.instance;
  const gameItemService = GameItemService.instance;
  let accountId = 0;

  const info: AccountParams = {
    address: '5Eo5BJntLSFRYGjzEedEguxVjH7dxo1iEXUCgXJEP2bFNHSo',
    signature: '0x660b13c0908541dcfdde53c0cb98e37ac47e4cd4d032941e53b51aac593ed81b8ec5c0ac6123c3c51bd08f1ae7b88afda838314d6727bb0dc6b0d1ad5b18438a',
    telegramId: 12345699909987,
    telegramUsername: 'john_doe',
    firstName: 'John',
    lastName: 'Doe',
    photoUrl: 'https://via.placeholder.com/300x300',
    languageCode: 'en',
  };


  beforeAll(async () => {
    await SequelizeServiceImpl.syncAll();
    await SequelizeServiceImpl.truncateDB();

    const syncAccount = await accountService.syncAccountData(info, undefined, false);
    accountId = syncAccount.id;
  });

  afterAll(async () => {
    // await SequelizeServiceImpl.sequelize.close();
  });

  // Buy Energy test
  it('should throw an error if account is not found', async () => {
    jest.spyOn(AccountAttribute, 'findOne').mockResolvedValue(null);
    const notFoundId = 1231234;
    await gameItemService.buyEnergy(notFoundId)
      .catch(error => {
        expect(error.message).toBe('Account not found');
        expect(AccountAttribute.findOne).toHaveBeenCalledWith({where: {accountId: notFoundId}});
      });
  });

  // if Not enough points
  it('should throw an error if Not enough points', async () => {
    await gameItemService.buyEnergy(accountId).catch(error => {
      expect(error.message).toBe('Not enough points');
    });
  });

  // if account already buy max energy in day
  it('should throw an error if account already buy max energy in day', async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    jest.spyOn(Receipt, 'count').mockResolvedValue(EnvVars.Game.EnergyBuyLimit);
    await gameItemService.buyEnergy(accountId)
      .catch(error => {
        expect(error.message).toBe('You already buy max energy in day, pls go back tomorrow');
        expect(Receipt.count).toHaveBeenCalledWith({
          where: {
            userId: accountId,
            createdAt: {[Op.gte]: todayStart, [Op.lte]: todayEnd},
          },
        });
      });
  });

  // You already have max energy in your account
  it('should throw an error if the account already has max energy', async () => {
    const maxEnergy = EnvVars.Game.MaxEnergy;
    await AccountAttribute.update({energy: maxEnergy, point: 10000}, {where: {accountId: accountId}});

    // Try to buy energy and expect an error
    await gameItemService.buyEnergy(accountId)
      .catch(error => {
        expect(error.message).toBe('You already have max energy');
      });
  });


  // successfully 
  it('should successfully buy energy with a different energy price and return the correct response', async () => {
    await AccountAttribute.update({energy: 0, point: 10000}, {where: {accountId: accountId}});
    const result = await gameItemService.buyEnergy(accountId);

    // attribute
    const accountNewAttribute = await accountService.getAccountAttribute(accountId, false);
    expect(result).toEqual({
      success: true,
      point: accountNewAttribute.point,
      energy: accountNewAttribute.energy,
      receiptId: 1,
    });
  });

});
