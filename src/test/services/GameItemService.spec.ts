import { AccountService } from '@src/services/AccountService';
import { AccountParams } from '@src/models/Account';
import { AccountAttribute, GameInventoryItem, GameInventoryItemStatus, GameItem, Receipt } from '@src/models';
import EnvVars from '@src/constants/EnvVars';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import { GameItemService } from '@src/services/GameItemService';
import { createGameData, createSampleGameData } from '@src/test/data_samples/Games';
import { QuickGetService } from '@src/services/QuickGetService';

interface sampleGameItemsParams {
  id: number;
  maxBuy: number;
}

describe('Game Item Test', () => {
  const accountService = AccountService.instance;
  const gameItemService = GameItemService.instance;
  const quickGet = QuickGetService.instance;
  let sampleGameItems: sampleGameItemsParams[] = [];
  let accountId = 0;
  const info: AccountParams = {
    address: '5Eo5BJntLSFRYGjzEedEguxVjH7dxo1iEXUCgXJEP2bFNHSo',
    signature:
      '0x660b13c0908541dcfdde53c0cb98e37ac47e4cd4d032941e53b51aac593ed81b8ec5c0ac6123c3c51bd08f1ae7b88afda838314d6727bb0dc6b0d1ad5b18438a',
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
    const sampleDataGame = await createSampleGameData();
    sampleGameItems = sampleDataGame.createdGameItems;
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
    await gameItemService.buyEnergy(notFoundId).catch((error: Error) => {
      errorOccurred = true;
      expect(error.message).toBe('AccountAttribute not found');
    });
    expect(errorOccurred).toBe(true);
  });

  // Not enough points
  it('should throw an error if Not enough points', async () => {
    let errorOccurred = false;
    await gameItemService.buyEnergy(accountId).catch((error: Error) => {
      errorOccurred = true;
      expect(error.message).toBe('Not enough points');
    });

    expect(errorOccurred).toBe(true);
  });

  // Max energy in day
  it('should throw an error if account already buy max energy in day', async () => {
    jest.spyOn(Receipt, 'count').mockResolvedValue(EnvVars.Game.EnergyBuyLimit);
    let errorOccurred = false;
    await gameItemService.buyEnergy(accountId).catch((error: Error) => {
      errorOccurred = true;
      expect(error.message).toBe('You have reached your daily purchase limit. Please try again tomorrow.');
    });
    expect(errorOccurred).toBe(true);
  });

  // Max energy
  it('should throw an error if the account already has max energy', async () => {
    const maxEnergy = EnvVars.Game.MaxEnergy;
    await accountService.addAccountPoint(accountId, 1000);
    await accountService.addEnergy(accountId, maxEnergy);
    let errorOccurred = false;

    await gameItemService.buyEnergy(accountId).catch((error: Error) => {
      errorOccurred = true;
      expect(error.message).toBe('You already have max energy');
    });

    expect(errorOccurred).toBe(true);
  });

  // Successfully buying energy
  it('should successfully buy energy with a different energy price and return the correct response', async () => {
    await accountService.addAccountPoint(accountId, 1000);
    await accountService.useAccountEnergy(accountId, 1000);
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
  it('should throw an error if Not enough points', async () => {
    let errorOccurred = false;
    await createGameData(accountId);
    await accountService.useAccountPoint(accountId, 1000000000).catch((error: Error) => {
      errorOccurred = true;
      expect(error.message).toBe('Not enough point');
    });
    await gameItemService.buyItem(accountId, sampleGameItems[0].id).catch((error: Error) => {
      errorOccurred = true;
      expect(error.message).toBe('Not enough points');
    });
    expect(errorOccurred).toBe(true);
  });

  it('should throw an error if max buy item', async () => {
    let errorOccurred = false;
    await accountService.addAccountPoint(accountId, 10000);
    await createGameData(accountId);
    await gameItemService.buyItem(accountId, sampleGameItems[0].id, 20).catch((error: Error) => {
      errorOccurred = true;
      expect(error.message).toBe(`Cannot buy more than ${sampleGameItems[0].maxBuy} items at once.`);
    });
    expect(errorOccurred).toBe(true);
  });

  it('should throw an error if max buy in day', async () => {
    await accountService.addAccountPoint(accountId, 10000);
    await createGameData(accountId);
    let errorOccurred = false;
    jest.spyOn(Receipt, 'count').mockResolvedValue(EnvVars.Game.EnergyBuyLimit);
    await gameItemService.buyItem(accountId, sampleGameItems[0].id, 1).catch((error: Error) => {
      errorOccurred = true;
      expect(error.message).toBe('You have reached your daily purchase limit. Please try again tomorrow.');
    });
    expect(errorOccurred).toBe(true);
  });

  it('should successfully buy item with a Eternal item', async () => {
    await accountService.addAccountPoint(accountId, 1000);
    await createGameData(accountId);
    const getGameItem = await GameItem.findOne({ where: { effectDuration: EnvVars.GameItem.EternalItem } });
    const gameIdItem = getGameItem?.id ?? 100;
    const result = await gameItemService.buyItem(accountId, gameIdItem, 1);
    const account = await quickGet.requireAccountAttribute(accountId);
    expect(result.point).toBe(account.point);
    expect(result).toEqual({
      success: true,
      point: result.point,
      receiptId: result.receiptId,
      inventoryId: result.inventoryId,
      itemGroupLevel: result.itemGroupLevel,
    });
  });

  it('should successfully buy item with a Disposable item', async () => {
    await accountService.addAccountPoint(accountId, 1000);
    await createGameData(accountId);
    const getGameItem = await GameItem.findOne({ where: { effectDuration: EnvVars.GameItem.DisposableItem } });
    const gameItemId: number = getGameItem?.id ?? 100;
    const result = await gameItemService.buyItem(accountId, gameItemId, 1);
    const account = await quickGet.requireAccountAttribute(accountId);
    expect(result.point).toBe(account.point);
    expect(result).toEqual({
      success: true,
      point: result.point,
      receiptId: result.receiptId,
      inventoryId: result.inventoryId,
      itemGroupLevel: result.itemGroupLevel,
    });
  });

  // End Buy Item

  // Use Item
  it('should successfully to buy item with a Disposable item', async () => {
    await accountService.addAccountPoint(accountId, 1000);
    await createGameData(accountId);
    const getGameItem = await GameItem.findOne({ where: { effectDuration: EnvVars.GameItem.DisposableItem } });
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
    await accountService.addAccountPoint(accountId, 1000);
    await createGameData(accountId);
    const getGameItem = await GameItem.findOne({ where: { effectDuration: EnvVars.GameItem.EternalItem } });
    const gameItemId: number = getGameItem?.id ?? 100;
    const gameItemResult = await gameItemService.buyItem(accountId, gameItemId, 1);
    let errorOccurred = false;
    await gameItemService.useInventoryItem(accountId, gameItemResult.inventoryId).catch((error: Error) => {
      errorOccurred = true;
      expect(error.message).toBe('Your item is not a disposable item');
    });
    expect(errorOccurred).toBe(true);
  });

  it('should throw an error to buy item not active  ', async () => {
    await accountService.addAccountPoint(accountId, 1000);
    await createGameData(accountId);
    const getGameItem = await GameItem.findOne({ where: { effectDuration: EnvVars.GameItem.DisposableItem } });
    const gameItemId: number = getGameItem?.id ?? 100;
    const gameItemResult = await gameItemService.buyItem(accountId, gameItemId, 1);
    let errorOccurred = false;
    await GameInventoryItem.update(
      { status: GameInventoryItemStatus.INACTIVE || GameInventoryItemStatus.USED },
      { where: { id: gameItemResult.inventoryId } },
    );
    await gameItemService.useInventoryItem(accountId, gameItemResult.inventoryId).catch((error: Error) => {
      errorOccurred = true;
      expect(error.message).toBe('Your item is inactive');
    });
    expect(errorOccurred).toBe(true);
  });
});
