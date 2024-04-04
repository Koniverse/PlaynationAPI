import {BalanceService, BalanceServiceImpl} from '@src/services/BalanceService';
import ChainServiceImpl from '@src/services/ChainService';
import {Faucet, User} from '@src/models';
import {ExtensionAccountType} from '@src/types';
import {SubmitFaucetParams} from '@src/services/type';
import EnvVars from '@src/constants/EnvVars';
import {validateSignature} from '@src/utils';
import {BN} from '@polkadot/util';
const DECIMAL = 12;
const AIRDROP_NUM = 10 ** DECIMAL * EnvVars.NUMBER_OF_SEND;
const AIRDROP_AMOUNT = new BN(AIRDROP_NUM);
const MIN_AMOUNT = new BN(AIRDROP_NUM * (EnvVars.NUMBER_OF_SEND + 1));

export class FaucetService {
  public constructor(private balanceService: BalanceService) {

  }

  public async checkBalancesWithToken(tokenId: number|string,address: string) {
    const api = await ChainServiceImpl.getApi();
    const account = await api.query.assets.account(Number(tokenId), address);
    const data = account.toJSON() as {balance: number} ;
    if (data){
      const {balance} = data;
      return (new BN(balance).gt(new BN(0)));
    }
    return false;
  }

  public async checkBalances(address: string) {
    const tokenIds = EnvVars.TOKEN_ID_LIST;
    const promiseList = tokenIds.map((tokenId) => {
      return this.checkBalancesWithToken(tokenId, address);
    });
    const result = await Promise.all(promiseList);

    return result.some((item) => item);
  }

  public async checkBalancesSend() {
    const address = EnvVars.ADDRESS_FAUCET_SEND;
    const api = await ChainServiceImpl.getApi();
    if (!address) {
      return false;
    }
    const { data: { free: balance } } = await api.query.system.account(address);
    return new BN(balance).gt(MIN_AMOUNT);
  }

  public async checkBalancesNative(address: string) {
    if (!address) {
      return false;
    }
    const api = await ChainServiceImpl.getApi();
    const { data: { free: balance } } = await api.query.system.account(address);

    return !balance.gt(new BN(0));
  }

  public async checkFaucet(address: string) {
    const status ={
      hasNotReceivedFaucet: true,
      accountReceived: true,
      accountSent: true,
      accountReceivedNative: true,
    };

    const [faucetData, accountSent, accountReceived, accountReceivedNative] = await Promise.all([
      Faucet.findOne({where: {address}}),
      this.checkBalancesSend(),
      this.checkBalances(address),
      this.checkBalancesNative(address),
    ]);

    if (faucetData) {
      status.hasNotReceivedFaucet = false;
    }

    status.accountSent = accountSent;
    status.accountReceived = accountReceived;
    status.accountReceivedNative = accountReceivedNative;
    return status;
  }

  public async createTransaction(address: string) {
    const api = await ChainServiceImpl.getApi();
    console.log('createTransaction', address);
    const faucetExtrinsic = api.tx.balances.transfer(address, AIRDROP_AMOUNT);

    return await ChainServiceImpl.runExtrinsic(faucetExtrinsic);
  }

  public async submitFaucet(data: SubmitFaucetParams) {
    const {address, signature, extension} = data;
    const valid = await this.checkFaucet(address);
    if (!valid.hasNotReceivedFaucet || !valid.accountReceived || !valid.accountSent || !valid.accountReceivedNative) {
      return valid;
    }
    const result = {...valid, validSignature: true, transaction: false, txHash: ''};
    const user = await User.findOne({where: {address}});
    if (!user) {
      result.validSignature = false;
      return result;
    }
    const validSignature = validateSignature(address, user.randomCode, signature);
    if (!validSignature) {
      result.validSignature = false;
      return result;
    }
    const extensionType = extension !== 'subwallet' ? ExtensionAccountType.POLKADOT : ExtensionAccountType.SUBWALLET;
    const dataFaucet = await Faucet.create({
      address: address,
      transaction: false,
      amount: EnvVars.NUMBER_OF_SEND,
      decimal: DECIMAL,
      signature: signature,
      faucet_network: 'Parallel',
      faucet_amount: EnvVars.NUMBER_OF_SEND,
      extension_type: extensionType,
      txHash: '',
    });

    // Send faucet transaction
    const {extrinsicHash} = await this.createTransaction(address);

    if (extrinsicHash) {
      result.transaction = true;
      result.txHash = extrinsicHash;
      dataFaucet.txHash = extrinsicHash;
      dataFaucet.transaction = true;
      await dataFaucet.save();
    }

    return result;
  }
}

export const FaucetServiceImpl = new FaucetService(BalanceServiceImpl);
