import {AccountService} from '@src/services/AccountService';
import {Account} from '@src/models/Account';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {createSampleAccounts} from '@src/test/data_samples/Accounts';
import rankJson from '@src/data/ranks.json';
import { AccountAttributeRank } from '@src/models';
import ReferralUpgradeLog from '@src/models/ReferralUpgradeLog';
import * as console from 'node:console';

interface Rank {
    rank: string;
    minPoint: number;
    maxPoint: number;
    invitePoint: number;
    premiumInvitePoint: number;
}
function getRankPoint(rank: string): Rank | undefined{
  console.log('Rank', rank);
  const dataRank = rankJson.find((r) => r.rank === rank);
  return dataRank;
}

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
    console.log('Check LV0 invite LV1');
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
    console.log('Account 0', accLv0Point00, '==>', accLv0Point01);
    expect(accLv0Point01).toEqual(accLv0Point00 + 200);

    // ========================================
    // Check ref lv2
    console.log('Check LV1 invite LV2');
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
    console.log('Account 1', accLv1Point00, '==>', accLv1Point01);
    expect(accLv1Point01).toEqual(accLv1Point00 + 200);

    const accLv0Point02 = await accountService.getAccountAttribute(accountLv0.id).then((attrs) => attrs.point);
    console.log('Account 0', accLv0Point01, '==>', accLv0Point02);
    expect(accLv0Point02).toEqual(accLv0Point01 + 10);


    // ========================================
    // Check ref lv3 with premium
    console.log('Check LV2 invite LV3 with premium');
    const accLv2Point00 = await accountService.getAccountAttribute(accountLv2.id).then((attrs) => attrs.point);
    const accountLv3  = await accountService.syncAccountData({
      address: '5D22a7RAa51CkeFmJFPZmCfXwZ4YALxt6Sx2L5KmF6vos84p',
      signature: '0x660b13c0908541dcfdde53c0cb98e37ac47e4cd4d032941e53b51aac593ed81b8ec5c0ac6123c3c51bd08f1ae7b88afda838314d6727bb0dc6b0d1ad5b18438a',
      telegramId: 1234539890398,
      telegramUsername: 'ref3',
      isPremium: true,
      firstName: 'Ref',
      lastName: '03',
      photoUrl: 'https://via.placeholder.com/300x300',
      languageCode: 'en',
    }, accountLv2.inviteCode, false);

    const accLv2Point01 = await accountService.getAccountAttribute(accountLv2.id).then((attrs) => attrs.point);
    console.log('Account 2', accLv2Point00, '==>', accLv2Point01);
    expect(accLv2Point01).toEqual(accLv2Point00 + 600);

    const accLv1Point02 = await accountService.getAccountAttribute(accountLv1.id).then((attrs) => attrs.point);
    console.log('Account 1', accLv1Point01, '==>', accLv1Point02);
    expect(accLv1Point02).toEqual(accLv1Point01 + 30);

    const accLv0Point03 = await accountService.getAccountAttribute(accountLv0.id).then((attrs) => attrs.point);
    console.log('Account 0', accLv0Point02, '==>', accLv0Point03);
    expect(accLv0Point03).toEqual(accLv0Point02);

    // ========================================
    // Check ref lv1 upgrade rank
    console.log('Check LV1 upgrade rank');

    // Upgrade from iron to bronze
    await accountService.addAccountPoint(accountLv1.id, 30000);
    console.log('Upgrade rank account lv1', '+30000 points');
    const accLv1Point03 = await accountService.getAccountAttribute(accountLv1.id).then((attrs) => attrs.point);

    // Account lv0 should get more 500 points
    const accLv0Point04 = await accountService.getAccountAttribute(accountLv0.id).then((attrs) => attrs.point);
    console.log('Account 0', accLv0Point03, '==>', accLv0Point04);
    expect(accLv0Point04).toEqual(accLv0Point03 + 500);

    // ================================================================
    // Check upgrade rank
    console.log('Check LV3 upgrade rank');

    // Upgrade from iron to bronze
    await accountService.addAccountPoint(accountLv3.id, 30000);
    console.log('Upgrade rank account lv3', '+30000 points');

    // Account lv2 should get more 1500 points
    const accLv2Point02 = await accountService.getAccountAttribute(accountLv2.id).then((attrs) => attrs.point);
    console.log('Account 2', accLv2Point01, '==>', accLv2Point02);
    expect(accLv2Point02).toEqual(accLv2Point01 + 1500);

    // Account lv1 should get more 75 points

    const accLv1Point04 = await accountService.getAccountAttribute(accountLv1.id).then((attrs) => attrs.point);
    console.log('Account 1', accLv1Point03, '==>', accLv1Point04);
    expect(accLv1Point04).toEqual(accLv1Point03 + 75);
    console.log('Check log rank');
    await checkLogRank(AccountAttributeRank.BRONZE, accountLv2);
    await checkLogRank(AccountAttributeRank.SILVER, accountLv2);
    await checkLogRank(AccountAttributeRank.GOLD, accountLv2);
    await checkLogRank(AccountAttributeRank.PLATINUM, accountLv2);
    await checkLogRank(AccountAttributeRank.DIAMOND, accountLv2);
    await checkLogRank(AccountAttributeRank.BRONZE, accountLv3);
    await checkLogRank(AccountAttributeRank.SILVER, accountLv3);
    await checkLogRank(AccountAttributeRank.GOLD, accountLv3);
    await checkLogRank(AccountAttributeRank.PLATINUM, accountLv3);
    await checkLogRank(AccountAttributeRank.DIAMOND, accountLv3);
  });
  async function checkLogRank(rank: AccountAttributeRank, account: Account) {
    const rankData = getRankPoint(rank.toString());
    if (!rankData) {
      return;
    }
    const giveAccountPoint = {
      inviteCode: account.inviteCode,
      point: rankData.minPoint,
      rank,
    };
    await accountService.giveAccountPoint(giveAccountPoint);
    const referralLog = await ReferralUpgradeLog.findOne({
      where: {
        invitedAccountId: account.id,
        rank,
      },
    });
    if (!referralLog) {
      throw new Error('Not found log');
    }
    const point = account.isPremium ? rankData.premiumInvitePoint : rankData.invitePoint;
    console.log(`Check log f1 with rank ${rank} acccount ${account.telegramUsername}: ${point} points`);
    expect(referralLog.point).toEqual(point);
    console.log(`Check log f2 with rank ${rank}  acccount ${account.telegramUsername} indirect point: ${point * 0.05} points`);
    expect(referralLog.indirectPoint).toEqual(point * 0.05);
  }
});
