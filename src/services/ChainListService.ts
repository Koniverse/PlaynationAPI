import {ChainService} from '@src/services/ChainService';
import {keyring} from '@polkadot/ui-keyring';
import {ChainInfoMap} from '@subwallet/chain-list';
import EnvVars from '@src/constants/EnvVars';
import {BN} from '@polkadot/util';
import {isAddress} from '@polkadot/util-crypto';
import * as console from 'node:console';

export interface CreateTransactionParams {
    address: string;
    network: string;
    decimal: number;
    amount: number;
}

enum ErrorTransfer {
  ERR_INVALID_WALLET_ADDRESS = 'ERR_INVALID_WALLET_ADDRESS',
  ERR_MISSING_TOKEN = 'ERR_MISSING_TOKEN',
  ERR_INCORRECT_NETWORK = 'ERR_INCORRECT_NETWORK',
  ERR_INSUFFICIENT_GAS_FEES = 'ERR_INSUFFICIENT_GAS_FEES',
}
interface ChainData {
    address: string;
    seedPhrase: string;
}
export class ChainListService {
  public chainServiceList: Record<string, ChainService> = {};
  public constructor() {
    keyring.loadAll({type: 'sr25519'});
    const chainList = EnvVars.ChainService.networkConfig as Record<string, ChainData>;
    Object.keys(chainList).forEach((chain) => {
      const dataChain = chainList[chain] ?? {};
      const {address, seedPhrase} = dataChain;
      const chainInfo = ChainInfoMap[chain];
      const endpoints = Object.values(chainInfo.providers).filter((x) => x.startsWith('wss://'));
      if (chainInfo && endpoints.length) {
        try {
          this.chainServiceList[chain] = new ChainService(endpoints[0], address, seedPhrase);
        } catch (e) {
          console.log('ChainListService', endpoints[0]);
          console.log(e);
        }
      }
    });
  }
  getChainService(chainName: string) {
    return this.chainServiceList[chainName];
  }
  public async createTransfer(address: string, network: string, decimal: number, amount: number) {
    const chainService = this.getChainService(network);
    if (!chainService) {
      throw new Error(ErrorTransfer.ERR_INCORRECT_NETWORK);
    }
    const checkAddress = isAddress(address);
    if (!checkAddress) {
      throw new Error(ErrorTransfer.ERR_INVALID_WALLET_ADDRESS);
    }
    console.log('checkAddress', checkAddress);
    const api = await chainService.getApi();
    const airdropAccount = (amount - EnvVars.ChainService.estimatedFee) * 10 ** decimal;

    const AIRDROP_AMOUNT = new BN(airdropAccount);
    const MINIMUM_BALANCE = new BN(EnvVars.ChainService.minimumBalance  * 10 ** decimal);
    const isCanSend = await chainService.checkBalancesSend(MINIMUM_BALANCE);
    if (!isCanSend) {
      throw new Error(ErrorTransfer.ERR_MISSING_TOKEN);
    }
    const extrinsic = api.tx.balances.transferKeepAlive(address, AIRDROP_AMOUNT);
    return await chainService.runExtrinsic(extrinsic);
  }
}
export const ChainListServiceImpl = new ChainListService();
