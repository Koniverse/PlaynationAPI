import {AccountService} from '@src/services/AccountService';
import {Account, AccountParams} from '@src/models/Account';
import {AccountAttribute, Game, GameData, GamePlay, Task, TaskHistory} from '@src/models';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {GameService} from '@src/services/GameService';
import {createSampleAccounts} from '@src/test/data_samples/Accounts';


describe('General Test', () => {
  const accountService = AccountService.instance;
  let sampleAccounts: Account[] = [];

  beforeAll(async () => {
    await SequelizeServiceImpl.syncAll();
    await SequelizeServiceImpl.truncateDB();

    // Create sample accounts
    sampleAccounts = await createSampleAccounts();
  });

  afterAll(async () => {
    // await SequelizeServiceImpl.sequelize.close();
  });
  
  it('Check invite lv1 and 2', async function () {
    const accountLv0 = sampleAccounts[0];
    const accLv0Point00 = await accountService.getAccountAttribute(accountLv0.id).then((attrs) => attrs.point);

    const accountLv1  = await accountService.syncAccountData({
      address: '5D56a7RAa81CkeFmJFPZmCfXwZ4YALxt6Sx2L5KmF6vos84p',
      signature: '0x660b13c0908541dcfdde53c0cb98e37ac47e4cd4d032941e53b51aac593ed81b8ec5c0ac6123c3c51bd08f1ae7b88afda838314d6727bb0dc6b0d1ad5b18438a',
      telegramId: 1234539190998,
      telegramUsername: 'ref1',
      firstName: 'Ref',
      lastName: '01',
      photoUrl: 'https://via.placeholder.com/300x300',
      languageCode: 'en',
    }, accountLv0.inviteCode, false);

    const accLv0Point01 = await accountService.getAccountAttribute(accountLv0.id).then((attrs) => attrs.point);
    expect(accLv0Point01).toEqual(accLv0Point00 + 200);
  });
});