import {Keyring} from '@polkadot/api';
import {cryptoWaitReady, mnemonicGenerate} from '@polkadot/util-crypto';
import {CommonService} from '@src/services/CommonService';


describe('Chain Test', () => {
  it('should create transaction', async () => {
    await cryptoWaitReady();
    const keyring = new Keyring({type: 'sr25519'});
    const  promiseList = [];
    for (let i = 0; i < 100; i++) {
      const accountMnemonic = mnemonicGenerate();
      const account = keyring.createFromUri(accountMnemonic);
      const data = {
        address: account.address,
        network: 'alephTest',
        decimal: 12,
        amount: 1,
      };
      promiseList.push(CommonService.instance.callActionChainService('chain/create-transfer', data));
    }
    console.log('promiseList', promiseList.length);
    const result = await Promise.all(promiseList);
    console.log('result', result);
  });
});
