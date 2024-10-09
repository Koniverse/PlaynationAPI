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
    telegramId: 1234569990987,
    telegramUsername: 'john_doe',
    firstName: 'John',
    lastName: 'Doe',
    photoUrl: 'https://via.placeholder.com/300x300',
    languageCode: 'en',
  };

  beforeAll(async () => {
    await SequelizeServiceImpl.syncAll();
    await SequelizeServiceImpl.syncWithOptions({
      force: true,
    });
  });

  afterAll(async () => {
    // await SequelizeServiceImpl.sequelize.close();
  });

  it('User Create Account', async function () {
    const firstAccount = await accountService.syncAccountData(info, '123456');
  });

  it('Sync Account Actions', async function () {

  });

  it('Test game enought point', async function () {

  });

  it('Submit game  point', async function () {

  });
});
