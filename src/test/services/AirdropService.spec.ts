import {AirdropService} from '@src/services/AirdropService';
import {AccountService} from '@src/services/AccountService';

const airdropService = AirdropService.instance;
const accountService = AccountService.instance;

describe('AirdropService Test', () => {
  it('should handleRaffle', async () => {
    const accountId = 142757;
    const campaignId = 2;

    await accountService.addAccountPoint(accountId, 1000);
    const accountAttBefore = await accountService.getAccountAttribute(accountId);
    console.log('accountAttBefore', accountAttBefore.point, accountAttBefore.accumulatePoint);

    const raffleResult = await airdropService.handleRaffle(accountId, campaignId);

    console.log('raffleResult', raffleResult);

    const accountAttAfter = await accountService.getAccountAttribute(accountId);
    console.log('accountAttAfter', accountAttAfter.point, accountAttAfter.accumulatePoint);

    const expectValue = raffleResult.rewardType === 'NPS' ? (accountAttBefore.point + raffleResult.rewardAmount) : accountAttBefore.point;
    expect(accountAttAfter.point).toBe(expectValue - raffleResult.price);
  });
});