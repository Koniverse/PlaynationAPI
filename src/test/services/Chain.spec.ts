import {Keyring} from '@polkadot/api';
import {cryptoWaitReady, mnemonicGenerate} from '@polkadot/util-crypto';
import {CommonService} from '@src/services/CommonService';


describe('Chain Test', () => {
  it('should create transaction', async () => {
    await cryptoWaitReady();
    const keyring = new Keyring({type: 'sr25519'});
    const  addressList = [];
    for (let i = 0; i < 3; i++) {
      const accountMnemonic = mnemonicGenerate();
      const account = keyring.createFromUri(accountMnemonic);
      addressList.push(account.address);
    }
    
    const data = {
      address: addressList,
      network: 'alephTest',
      decimal: 12,
      amount: 1,
    };
    const result = await CommonService.instance.callActionChainService('chain/create-transaction', data);
    console.log(result);
  });
});
