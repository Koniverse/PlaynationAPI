import {AccountService} from '@src/services/AccountService';
import {ITelegramParams} from '@src/models/Account';


describe('AccountServiceTest', () => {
  const accountService = AccountService.instance;
  const walletAddresses = ['0xbB1A97c896d428486bd7bbd74963631cbF157769', '5EHhonxwirTubHcziT59rma7ZHtzeqHejz8vELQVLgX29o8q'];
  const info: ITelegramParams = {
    telegramId: 12345699909987,
    telegramUsername: 'join_doe',
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
    let account = await accountService.findByTelegramId(info.telegramId);

    if (!account) {
      account = await accountService.createAccount(info);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Link account with wallet
    const wallet1 = await accountService.linkWallet(account.id, walletAddresses[0]);
    const wallet2 = await accountService.linkWallet(account.id, walletAddresses[1]);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const accountDetails = await accountService.fetchAccountWithDetails(account.id);
    console.log(JSON.stringify(accountDetails, null, 2));

    // Remove all data
    await wallet1.destroy();
    await wallet2.destroy();
    await (await account.getAccountAttribute()).destroy();

    await new Promise((resolve) => setTimeout(resolve, 1000));
    await account.destroy();
  });
  
  it('Sync Account Actions', async function () {
    info.telegramId = 123456999099579;
    info.telegramUsername = 'jane_doe';

    // Sync on create
    let account = await accountService.syncAccountData({info, walletAddresses});
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(account.firstName).toEqual('John');
    expect(account.lastName).toEqual('Doe');
    expect(account.photoUrl).toEqual('https://via.placeholder.com/300x300');
    const updatedAt1 = account.updatedAt;

    //Sync on update info
    info.firstName = 'Jane';
    info.lastName = 'Nano';
    info.photoUrl = 'https://via.placeholder.com/360x360';
    walletAddresses.push('0x4199325C4230500370f3A3A1989BbFDDB46f22b8');

    account = await accountService.syncAccountData({info, walletAddresses});

    expect(account.updatedAt).not.toEqual(updatedAt1);

    expect(account.firstName).toEqual('Jane');
    expect(account.lastName).toEqual('Nano');
    expect(account.photoUrl).toEqual('https://via.placeholder.com/360x360');

    //Do not change anything
    const updatedAt2 = account.updatedAt;
    account = await accountService.syncAccountData({info, walletAddresses});

    expect(account.updatedAt).toEqual(updatedAt2);
  });
});