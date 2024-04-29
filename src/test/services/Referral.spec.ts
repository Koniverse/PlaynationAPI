import {AccountService} from '@src/services/AccountService';
import {Account} from '@src/models/Account';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {createSampleAccounts} from '@src/test/data_samples/Accounts';


describe('Referral Test', () => {
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
    // Check ref lv1
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

    // ========================================
    // Check ref lv2
    const accLv1Point00 = await accountService.getAccountAttribute(accountLv1.id).then((attrs) => attrs.point);
    const accountLv2  = await accountService.syncAccountData({
      address: '5D32a7RAa81CkeFmJFPZmCfXwZ4YALxt6Sx2L5KmF6vos84p',
      signature: '0x660b13c0908541dcfdde53c0cb98e37ac47e4cd4d032941e53b51aac593ed81b8ec5c0ac6123c3c51bd08f1ae7b88afda838314d6727bb0dc6b0d1ad5b18438a',
      telegramId: 2234539190998,
      telegramUsername: 'ref2',
      firstName: 'Ref',
      lastName: '02',
      photoUrl: 'https://via.placeholder.com/300x300',
      languageCode: 'en',
    }, accountLv1.inviteCode, false);

    const accLv1Point01 = await accountService.getAccountAttribute(accountLv1.id).then((attrs) => attrs.point);
    expect(accLv1Point01).toEqual(accLv1Point00 + 200);

    const accLv0Point02 = await accountService.getAccountAttribute(accountLv0.id).then((attrs) => attrs.point);
    expect(accLv0Point02).toEqual(accLv0Point01 + 10);


    // ========================================
    // Check ref lv3
    const accLv2Point00 = await accountService.getAccountAttribute(accountLv2.id).then((attrs) => attrs.point);
    const accountLv3  = await accountService.syncAccountData({
      address: '5D22a7RAa51CkeFmJFPZmCfXwZ4YALxt6Sx2L5KmF6vos84p',
      signature: '0x660b13c0908541dcfdde53c0cb98e37ac47e4cd4d032941e53b51aac593ed81b8ec5c0ac6123c3c51bd08f1ae7b88afda838314d6727bb0dc6b0d1ad5b18438a',
      telegramId: 1234539890398,
      telegramUsername: 'ref3',
      firstName: 'Ref',
      lastName: '03',
      photoUrl: 'https://via.placeholder.com/300x300',
      languageCode: 'en',
    }, accountLv2.inviteCode, false);

    const accLv2Point01 = await accountService.getAccountAttribute(accountLv2.id).then((attrs) => attrs.point);
    expect(accLv2Point01).toEqual(accLv2Point00 + 200);

    const accLv1Point02 = await accountService.getAccountAttribute(accountLv1.id).then((attrs) => attrs.point);
    expect(accLv1Point02).toEqual(accLv1Point01 + 10);

    const accLv0Point03 = await accountService.getAccountAttribute(accountLv0.id).then((attrs) => attrs.point);
    expect(accLv0Point03).toEqual(accLv0Point02);
  });
});