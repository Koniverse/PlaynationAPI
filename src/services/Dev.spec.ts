import {AccountService} from '@src/services/AccountService';
import {Account, AccountParams} from '@src/models';
import {GameService} from "@src/services/GameService";



describe('General Test', () => {
  const accountService = AccountService.instance;
  const gameService = GameService.instance;
  it('should fetchRefList', async () => {
    const data = await accountService.getReferralLog(12);
  });

  it('should give point', async () => {
    const account = await Account.findByPk(12);
    if (!account) {
      throw new Error('Account not found');
    }
    const attrs = await accountService.getAccountAttribute(account.id);
    await accountService.giveAccountPoint({
      inviteCode: account.inviteCode,
      point: 300,
    });

    const newAttrs = await accountService.getAccountAttribute(account.id);
    expect(newAttrs.point).toEqual(attrs.point + 300);
  });

  it('should add referral point', async () => {
    const account = await Account.findByPk(15);
    if (!account) {
      throw new Error('Account not found');
    }

    const attrs = await accountService.getAccountAttribute(account.id);
    console.log(attrs.point);

    const info: AccountParams = {
      address: '5Eo5BJntLSFRYGjzEedEguxVjH7dxo1iEEUCgXJEP6bFNHSo',
      signature: '0x660b13c0908541dcfdde53c0cb98e37ac47e4cd4d032941e53b51aac593ed81b8ec5c0ac6123c3c51bd08f1ae7b88afda838314d6727bb0dc6b0d1ad5b18438a',
      telegramId: Math.floor(Math.random() * 1000000000),
      telegramUsername: 'john_doex',
      firstName: 'Johnxx',
      lastName: 'Doxe',
      photoUrl: 'https://via.placeholder.com/300x300',
      languageCode: 'en',
      referralCode: account.inviteCode,
    };

    const newAccount = await accountService.syncAccountData(info, account.inviteCode, false);

    const attrs2 = await accountService.getAccountAttribute(account.id);

    console.log(attrs2.point);
  });

  it('should play game', async () => {
    const account = await Account.findByPk(12);
    if (!account) {
      throw new Error('Account not found');
    }

    const gameplay = await gameService.newGamePlay(account.id, 1);

    await new Promise((resolve) => setTimeout(resolve, 25001));
    try {
      await gameService.submitGameplay({
        gamePlayId: gameplay.id,
        signature: '0xxx',
        point: 100,
      });
    } catch (e) {
      console.log(e);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      await gameService.submitGameplay({
        gamePlayId: gameplay.id,
        signature: '0xxx',
        point: 100
      });
      console.log('OK');
    } catch (e) {
      console.log(e);
    }

    try {
      await gameService.submitGameplay({
        gamePlayId: gameplay.id,
        signature: '0xxx',
        point: 100
      });
    } catch (e) {
      console.log(e);
    }
  });
});