import {AccountService} from '@src/services/AccountService';
import {Account, AccountParams} from '@src/models/Account';
import {
  AccountAttribute,
  Game,
  GameData,
  GameInventoryItem,
  GameInventoryItemStatus,
  GamePlay,
  Task,
  TaskHistory,
} from '@src/models';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {GameService} from '@src/services/GameService';
import {GameItemService} from '@src/services/GameItemService';


describe('Game Item Test', () => {
  const accountService = AccountService.instance;
  const gameService = GameService.instance;
  const gameItemService = GameItemService.instance;

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
    await TaskHistory.truncate({cascade: true, restartIdentity: true});
    await Task.truncate({cascade: true, restartIdentity: true});
    await GamePlay.truncate({cascade: true, restartIdentity: true});
    await GameData.truncate({cascade: true, restartIdentity: true});
    await Game.truncate({cascade: true, restartIdentity: true});
    await AccountAttribute.truncate({cascade: true, restartIdentity: true});
    await Account.truncate({cascade: true, restartIdentity: true});
  });

  afterAll(async () => {
    // await SequelizeServiceImpl.sequelize.close();
  });

  it('Account Basic Action', async function () {
    // Create new account
    let account = await accountService.findByAddress(info.address);

    if (!account) {
      account = await accountService.createAccount(info);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Link account with wallet
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const accountDetails = await accountService.fetchAccountWithDetails(account.id);
    console.log(JSON.stringify(accountDetails, null, 2));
  });

  it('Sync Account Actions', async function () {
    info.telegramId = 123456999099579;
    info.telegramUsername = 'jane_doe';
    info.signature = '0x9c08554a19705048d85062a35776888fcf04f98695ca44d9df365c281e63611022c9dabba85ddad82ea05ccc58814b5d5bbafee833b3d776b1486bb76414668d';

    // Sync on create
    let account = await accountService.syncAccountData(info);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(account.firstName).toEqual('John');
    expect(account.lastName).toEqual('Doe');
    expect(account.photoUrl).toEqual('https://via.placeholder.com/300x300');
    const updatedAt1 = account.updatedAt;

    //Sync on update info
    info.firstName = 'Jane';
    info.lastName = 'Nano';
    info.photoUrl = 'https://via.placeholder.com/360x360';

    account = await accountService.syncAccountData(info);

    expect(account.updatedAt).not.toEqual(updatedAt1);

    expect(account.firstName).toEqual('Jane');
    expect(account.lastName).toEqual('Nano');
    expect(account.photoUrl).toEqual('https://via.placeholder.com/360x360');

    //Do not change anything
    const updatedAt2 = account.updatedAt;

    await new Promise((resolve) => setTimeout(resolve, 1000));

    account = await accountService.syncAccountData(info);
    expect(account.updatedAt).toEqual(updatedAt2);
  });

  it('Test game enought point', async function () {
    await SequelizeServiceImpl.syncAll();
    // Create new game
    const defaultGame = await gameService.generateDefaultData();

    // Listing game
    const currentUser = await accountService.syncAccountData(info);

    const defaultGameItem = await gameItemService.generateDefaultData(defaultGame.id);
    const newGame = await gameService.newGamePlay(currentUser.id, defaultGame.id);
    try {
      await gameItemService.submit(currentUser.id, defaultGameItem.id);
    }
    catch (e) {
      expect(e.message).toEqual('Not enough point');
    }
  });
  it('Submit game  point', async function () {
    await SequelizeServiceImpl.syncAll();
    // Create new game
    const defaultGame = await gameService.generateDefaultData();

    // Listing game
    const currentUser = await accountService.syncAccountData(info);
    const accountAttribute = await accountService.getAccountAttribute(currentUser.id, false);
    accountAttribute.point = 1000;
    await accountAttribute.save();

    const defaultGameItem = await gameItemService.generateDefaultData(defaultGame.id);
    const newGame = await gameService.newGamePlay(currentUser.id, defaultGame.id);
    const submitResult = await gameItemService.submit(currentUser.id, defaultGameItem.id);
    console.log('Game item submit result');
    expect(submitResult.success).toEqual(true);
    expect(submitResult.transactionId).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
    const accountNewAttribute = await accountService.getAccountAttribute(currentUser.id, false);
    expect(accountNewAttribute.point).toEqual(1000 - defaultGameItem.price);
    const validateGameItem = await gameItemService.validate(currentUser.id,  submitResult.transactionId,
      '0x000', false);
    const gameInventoryItem = await GameInventoryItem.findOne({where: {transactionId: submitResult.transactionId}});

    expect(validateGameItem.success).toEqual(true);
    if (gameInventoryItem) {
      console.log('Game inventory item validate by transactionId');
      expect(gameInventoryItem.status).toEqual(GameInventoryItemStatus.ACTIVE);
      const usedGameItem = await gameService.useGameInventoryItem(currentUser.id, gameInventoryItem.id);
      expect(usedGameItem.success).toEqual(true);
      const gameInventoryItemNew = await GameInventoryItem.findOne({where: {transactionId: submitResult.transactionId}});
      console.log('Game inventory item used');
      if (gameInventoryItemNew) {
        expect(gameInventoryItemNew.status).toEqual(GameInventoryItemStatus.USED);
      }
    }
  });
});