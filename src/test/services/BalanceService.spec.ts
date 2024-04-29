import {BalanceServiceImpl} from '@src/services/BalanceService';

describe('BalanceService', () => {
  it('should getBalance', async function () {
    const balance = await BalanceServiceImpl.getBalance('5EfM1fUcw9YvCcBUbJgLHriFHvKkuwYsZCAWKCkCQWitsddh');
    expect(balance.length).toBeGreaterThan(0);

    const [hasBalance, details] = await BalanceServiceImpl.checkBalance('6i4xDEE1Q2Bv8tnJtgD4jse4YTAzzCwCJVUehRQ93hCqKp8f');
    expect(hasBalance).toBe(true);
  });

  it('should getBalance Lightweight', async function () {
    const data = await BalanceServiceImpl.getLightweightBalance('6i4xDEE1Q2Bv8tnJtgD4jse4YTAzzCwCJVUehRQ93hCqKp8f');
    console.log(data);
  });
});