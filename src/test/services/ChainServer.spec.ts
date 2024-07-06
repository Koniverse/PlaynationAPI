import {ChainListServiceImpl} from '@src/services/ChainListService';
 

describe('Chain Test', () => {
  it('should get token Balance', async () => {
    const address = '5HWNHiKDMAMAUk1JNwxKCR3b5kWysVZ1bNv78yg5ds6qaECG';
    const network = 'statemint';
    const assetId = '30';

    const service = ChainListServiceImpl.getService(network);
    const tokenBalance = await service.getAssetHubTokenBalance(assetId, address);
  });

  it('should create transaction', async () => {
    const address = '5G9shJH6nK7xuaSc712aabEscMsKi1fMHvP7ekbhAvti2WdS';
    const network = 'alephTest';
    const decimal = 10;
    const amount = 1;

    const rs = await ChainListServiceImpl.createTransfer(address, network, decimal, amount);

    console.log(rs);
  });

  it('should create transaction token', async () => {
    const address = '5HWNHiKDMAMAUk1JNwxKCR3b5kWysVZ1bNv78yg5ds6qaECG';
    const network = 'statemint';
    const decimal = 10;
    const amount = 0.01;
    const token_slug = 'statemint-LOCAL-DED';

    const rs = await ChainListServiceImpl.createTransfer(address, network, decimal, amount, token_slug);

    console.log(rs);
  });

  it('should create airdrop', async () => {
    const address = '5G9shJH6nK7xuaSc712aabEscMsKi1fMHvP7ekbhAvti2WdS';
    const network = 'statemint';
    const decimal = 10;
    const amount = 0.33;
    const assetId = '30';

    const rs = await ChainListServiceImpl.createPolkadotAssetHubTokenTransfer(address, network, assetId, decimal, amount);

    console.log(rs);
  });
});
