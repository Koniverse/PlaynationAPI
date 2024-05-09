import { AccountService } from '@src/services/AccountService';
import account, { AccountParams } from '@src/models/Account';
import {
  AccountAttribute,
  Game,
  GameItem,
  Receipt,
  ReceiptEnum,
  GameInventoryItem,
  GameInventoryItemStatus,
} from '@src/models';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import { GameItemService } from '@src/services/GameItemService';
import EnvVars from '@src/constants/EnvVars';
import { Op } from 'sequelize';
import {createSampleGameData} from '@src/test/data_samples/Games';
import {QuickGetService} from '@src/services/QuickGetService';

describe('Game Item Test', () => {
  const accountService = AccountService.instance;
  const gameItemService = GameItemService.instance;
  const quickGet = QuickGetService.instance;

  let sampleGameItems:any = {};
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

  beforeEach(async () => {
    await SequelizeServiceImpl.syncAll();
    await SequelizeServiceImpl.truncateDB();
    const syncAccount = await accountService.syncAccountData(info, undefined, false);
    accountId = syncAccount.id;
    const sampleDataGame = await  createSampleGameData(accountId);
    sampleGameItems = sampleDataGame.createdGameItems
  });

  afterAll(async () => {
    await SequelizeServiceImpl.sequelize.close();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Buy Energy test
  it('should throw an error if account is not found', async () => {
    jest.spyOn(AccountAttribute, 'findOne').mockResolvedValue(null);
    const notFoundId = 1231234;
    let errorOccurred = false;

    await gameItemService.buyEnergy(notFoundId).catch(error => {
      errorOccurred = true;
      expect(error.message).toBe('AccountAttribute not found');
      expect(AccountAttribute.findOne).toHaveBeenCalledWith({ where: { accountId: notFoundId } });
    });

    expect(errorOccurred).toBe(true);
  });

  // Not enough points
  it('should throw an error if Not enough points', async () => {
    let errorOccurred = false;

    await gameItemService.buyEnergy(accountId).catch(error => {
      errorOccurred = true;
      expect(error.message).toBe('Not enough points');
    });

    expect(errorOccurred).toBe(true);
  });

  // Max energy in day
  it('should throw an error if account already buy max energy in day', async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    jest.spyOn(Receipt, 'count').mockResolvedValue(EnvVars.Game.EnergyBuyLimit);
    let errorOccurred = false;

    await gameItemService.buyEnergy(accountId).catch(error => {
      errorOccurred = true;
      expect(error.message).toBe('You have reached your daily purchase limit. Please try again tomorrow.');
      expect(Receipt.count).toHaveBeenCalledWith({
        where: {
          userId: accountId,
          type: ReceiptEnum.BUY_ENERGY,
          createdAt: { [Op.gte]: todayStart, [Op.lte]: todayEnd },
        },
      });
    });

    expect(errorOccurred).toBe(true);
  });

  // Max energy
  it('should throw an error if the account already has max energy', async () => {
    const maxEnergy = EnvVars.Game.MaxEnergy;
    await accountService.addAccountPoint(accountId,1000);
    await accountService.addEnergy(accountId,maxEnergy);
    let errorOccurred = false;

    await gameItemService.buyEnergy(accountId).catch(error => {
      errorOccurred = true;
      expect(error.message).toBe('You already have max energy');
    });

    expect(errorOccurred).toBe(true);
  });

  // Successfully buying energy
  it('should successfully buy energy with a different energy price and return the correct response', async () => {
    await accountService.addAccountPoint(accountId,1000);
    await accountService.useAccountEnergy(accountId,1000);
    const result = await gameItemService.buyEnergy(accountId);
    expect(result).toEqual({
      success: true,
      point: result.point,
      energy: result.energy,
      receiptId: result.receiptId,
    });
  });
// end buy energy

  // buy Item
  it('should throw an error if Not enough points', async () =>{
    let errorOccurred = false;
   await accountService.useAccountPoint(accountId,1000000000).catch(error => {
      errorOccurred = true;
      expect(error.message).toBe('Not enough point');
    });
    await gameItemService.buyItem(accountId,sampleGameItems[0].id).catch(error => {
      errorOccurred = true;
      expect(error.message).toBe('Not enough points');
    });
    expect(errorOccurred).toBe(true);

  })

  it('should throw an error if max buy item', async () => {
    await accountService.addAccountPoint(accountId,10000);
    let errorOccurred = false;
    await gameItemService.buyItem(accountId,sampleGameItems[0].id, 20).catch(error => {
      errorOccurred = true;
      expect(error.message).toBe('Please purchase smaller quantities ' + sampleGameItems[0].maxBuy);
    });
    expect(errorOccurred).toBe(true);
  })

  it('should throw an error if max buy in day', async () => {
    await accountService.addAccountPoint(accountId,10000)
    let errorOccurred = false;
    jest.spyOn(Receipt, 'count').mockResolvedValue(EnvVars.Game.EnergyBuyLimit);
    await gameItemService.buyItem(accountId,sampleGameItems[0].id, 1).catch(error => {
      errorOccurred = true;
      expect(error.message).toBe('You have reached your daily purchase limit. Please try again tomorrow.');
    });
    expect(errorOccurred).toBe(true);
  })

  it('should successfully buy item with a Eternal item', async () => {
    await accountService.addAccountPoint(accountId,1000)
    const getGameItem = await GameItem.findOne({where: {effectDuration: EnvVars.GameItem.EternalItem}});
    const gameIdItem = getGameItem?.id ?? 100 ;
    const result = await gameItemService.buyItem(accountId,gameIdItem,1);
    const account = await quickGet.requireAccountAttribute(accountId)
    expect(result.point).toBe(account.point)
    expect(result).toEqual({
      success: true,
      point: result.point,
      receiptId: result.receiptId,
      inventoryId: result.inventoryId,
      itemGroupLevel: result.itemGroupLevel,
    })
  })

  it('should successfully buy item with a Disposable item', async () => {
    await accountService.addAccountPoint(accountId,1000);
    const getGameItem = await GameItem.findOne({where: {effectDuration: EnvVars.GameItem.DisposableItem}});
    const gameItemId : number = getGameItem?.id ?? 100 ;
    const result = await gameItemService.buyItem(accountId,gameItemId,1);
    const account = await quickGet.requireAccountAttribute(accountId)
    expect(result.point).toBe(account.point)
    expect(result).toEqual({
      success: true,
      point: result.point,
      receiptId: result.receiptId,
      inventoryId: result.inventoryId,
      itemGroupLevel: result.itemGroupLevel,
    })
  })

  // End Buy Item

  // Use Item
  it('should successfully to buy item with a Disposable item', async () => {
    await accountService.addAccountPoint(accountId,1000);
    const getGameItem = await GameItem.findOne({where: {effectDuration: EnvVars.GameItem.DisposableItem}});
    const gameItemId: number = getGameItem?.id ?? 100;
    const gameItemResult = await gameItemService.buyItem(accountId, gameItemId, 1);
    const result = await gameItemService.useInventoryItem(accountId, gameItemResult.inventoryId);
    expect(result).toEqual({
      success: true,
      inventoryStatus: result.inventoryStatus,
      remainingItem: result.remainingItem,
    });
  });

  it('should throw an error to buy item not EternalItem item ', async () => {
    await accountService.addAccountPoint(accountId,1000);
    const getGameItem = await GameItem.findOne({where: {effectDuration: EnvVars.GameItem.EternalItem}});
    const gameItemId: number = getGameItem?.id ?? 100;
    const gameItemResult = await gameItemService.buyItem(accountId, gameItemId, 1);
    let errorOccurred = false;
    await gameItemService.useInventoryItem(accountId,gameItemResult.inventoryId).catch(error => {
      errorOccurred = true;
      expect(error.message).toBe('Your item is not a disposable item');
    });
    expect(errorOccurred).toBe(true);
  })

  it('should throw an error to buy item not active  ', async () => {
    await accountService.addAccountPoint(accountId,1000);
    const getGameItem = await GameItem.findOne({where: {effectDuration: EnvVars.GameItem.DisposableItem}});
    const gameItemId: number = getGameItem?.id ?? 100;
    const gameItemResult = await gameItemService.buyItem(accountId, gameItemId, 1);
    let errorOccurred = false;
    await GameInventoryItem.update({status: GameInventoryItemStatus.INACTIVE || GameInventoryItemStatus.USED }, { where: { id: gameItemResult.inventoryId } });
    await gameItemService.useInventoryItem(accountId,gameItemResult.inventoryId).catch(error => {
      errorOccurred = true;
      expect(error.message).toBe('Your Item is inactive, can\'t be used');
    });
    expect(errorOccurred).toBe(true);
  });
});
