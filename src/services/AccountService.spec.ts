import {AccountService} from '@src/services/AccountService';
import {AccountParams} from '@src/models/Account';


describe('AccountServiceTest', () => {
  const accountService = AccountService.instance;
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
    // await SequelizeServiceImpl.sequelize.truncate({cascade: true});
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

    // Remove all data
    await (await account.getAccountAttribute()).destroy();

    await new Promise((resolve) => setTimeout(resolve, 1000));
    await account.destroy();
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
});