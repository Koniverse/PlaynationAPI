import {ChainService} from '@src/services/ChainService';
import {keyring} from '@polkadot/ui-keyring';
import {ChainInfoMap} from '@subwallet/chain-list';
import EnvVars from '@src/constants/EnvVars';
import {BN} from '@polkadot/util';

export interface CreateTransactionParams {
    address: string;
    network: string;
    decimal: number;
    amount: number;
}
export class ChainListService {
  public chainServiceList: Record<string, ChainService> = {};
  public constructor() {
    keyring.loadAll({type: 'sr25519'});
    const chainList = EnvVars.ChainService.Networks;
    chainList.forEach((chain) => {
      const chainInfo = ChainInfoMap[chain];
      const endpoints = Object.values(chainInfo.providers).filter((x) => x.startsWith('wss://'));
      if (chainInfo && endpoints.length) {
        try {
          this.chainServiceList[chain] = new ChainService(endpoints[0]);
        } catch (e) {
          console.log('ChainListService', endpoints[0]);
          console.log(e);
        }
      }
    });
  }

  // Singleton
  private static _instance: ChainListService;
  public static get instance(): ChainListService {
    if (!this._instance) {
      this._instance = new ChainListService();
    }
    return this._instance;
  }
  getChainService(chainName: string) {
    return this.chainServiceList[chainName];
  }
  public async createTransfer(address: string, network: string, decimal: number, amount: number) {
    const chainService = this.getChainService(network);
    if (!chainService) {
      return;
    }
    const api = await chainService.getApi();
    const airdropAccount = amount * 10 ** decimal;
    
    const AIRDROP_AMOUNT = new BN(airdropAccount);
    const isCanSend = await chainService.checkBalancesSend(EnvVars.ChainService.AddressSend, AIRDROP_AMOUNT);
    if (!isCanSend) {
      throw new Error('Not enough balance');
    }
    const extrinsic = api.tx.balances.transferKeepAlive(address, AIRDROP_AMOUNT);
    return await chainService.runExtrinsic(extrinsic);
  }
}
export const ChainListServiceImpl = new ChainListService();
