import {ChainService} from '@src/services/ChainService';
import {keyring} from '@polkadot/ui-keyring';
import {ChainInfoMap} from '@subwallet/chain-list';

export interface CreateTransactionParams {
    address: string;
    network: string;
    decimal: number;
    amount: number;
}
export const CHAIN_ENDPOINT_MAP = {
  aleptZero: 'wss://ws.test.azero.dev',
  avail: 'wss://turing-rpc.avail.so/ws',
  // dot: 'ws://127.0.0.1:9944',
  dot: 'wss://nodle-parachain.api.onfinality.io/public-ws',
  westend: 'wss://westend-rpc.polkadot.io',
  // edgeware: ['wss://edgeware-rpc.dwellir.com'],
  // polkadex: ['wss://mainnet.polkadex.trade']
};
export class ChainListService {
  public chainServiceList: Record<string, ChainService> = {};
  public constructor() {
    keyring.loadAll({type: 'sr25519'});
    // const chainList = Object.keys(ChainInfoMap);
    // chainList.forEach((chain) => {
    //   const chainInfo = ChainInfoMap[chain];
    //   const endpoints = Object.values(chainInfo.providers).filter((x) => x.startsWith('wss://'));
    //   if (chainInfo && endpoints.length) {
    //     console.log('ChainListService', endpoints[0]);
    //     try {
    //       this.chainServiceList[chain] = new ChainService(endpoints[0]);
    //     } catch (e) {
    //       console.log('ChainListService', endpoints[0]);
    //       console.log(e);
    //     }
    //   }
    // });
    Object.entries(CHAIN_ENDPOINT_MAP).forEach(([key, endPoints]) => {
      this.chainServiceList[key] = new ChainService(endPoints);
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
  public async createTransaction(address: string, network: string, decimal: number, amount: number) {
    const chainService = this.getChainService(network);
    if (!chainService) {
      return;
    }
    const api = await chainService.getApi();
    console.log('createTransaction', address);
    const AIRDROP_AMOUNT = amount * 10 ** decimal;
    const faucetExtrinsic = api.tx.balances.transferKeepAlive(address, AIRDROP_AMOUNT);
    return await chainService.runExtrinsic(faucetExtrinsic);
  }
  async getChainList() {
    return [];

  }
}

console.log('ChainListServiceImpl =============');
export const ChainListServiceImpl = new ChainListService();
// ChainServiceImpl.isReady.then();
