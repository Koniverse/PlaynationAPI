import '@polkadot/types-augment';
import {ApiPromise, WsProvider} from '@polkadot/api';
import {Vec} from '@polkadot/types-codec';
import {KeyValueOption} from '@polkadot/types/interfaces/state/types';
import {FrameSystemAccountInfo} from '@polkadot/types/lookup';
import {balanceFormatter, methodHash, hashAddress, concatHash} from './helper';
import EnvVars from '@src/constants/EnvVars';
import logger from 'jet-logger';

export class LightConnector {
  provider: WsProvider;
  networkKey: string;
  chainInfoIsReady: Promise<void>;
  endpoint?: string;
  chainName?: string;
  genesisHash?: string;
  ss58Format?: number;
  tokenDecimals?: Array<number>;
  tokenSymbol?: Array<string>;
  isReady: Promise<WsProvider>;
  private _api?: ApiPromise;

  private isConnecting = true;

  constructor(networkKey: string, endpoints: string[]) {
    this.networkKey = networkKey;
    const apiKey = EnvVars.ONFINALITY_TOKEN;
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      if (endpoint.includes('onfinality.io') && apiKey.length) {
        endpoints[i] = endpoint + '?apikey=' + apiKey;
      }
    }

    // Init provider from endpoint
    const provider = new WsProvider(endpoints, 3000);
    this.isReady = provider.isReady;
    this.provider = provider;

    let connectInterval: NodeJS.Timeout;

    provider.on('connected', () => {
      this.isConnecting = false;
      logger.info(`Connected to ${this.networkKey} node | ${provider.endpoint}`);
      clearInterval(connectInterval);
    });

    provider.on('disconnected', () => {
      logger.info(`Disconnected with ${this.networkKey} node`);
      if (!this.isConnecting) {
        this.isConnecting = true;
        connectInterval = setInterval(async () => {
          await provider.disconnect();
          await provider.connect();
        }, 9000);
      }
    });

    provider.on('error', logger.err);

    this.chainInfoIsReady = this.getChainInfo();
  }

  get api() {
    if (!this._api) {
      this._api = new ApiPromise({provider: this.provider});
    }

    return this._api;
  }

  public async getConstant<T>(key: string) {
    await this.isReady;
    return (await this.provider.send(key, [], true)) as T;
  }

  public async getChainInfo() {
    await this.isReady;
    return await Promise.all([
      this.getConstant<string>('chain_getBlockHash'),
      this.getConstant<{
        ss58Format: number,
        tokenDecimals: number | number[],
        tokenSymbol: string | string[]
      }>('system_properties'),
      this.getConstant<string>('system_chain'),
    ])
      .then(([genesisHash, {ss58Format, tokenDecimals, tokenSymbol}, chainName]) => {
        this.genesisHash = genesisHash;
        this.ss58Format = ss58Format;
        this.tokenDecimals = (typeof tokenDecimals === 'number') ? [tokenDecimals] : tokenDecimals;
        this.tokenSymbol = (typeof tokenSymbol === 'string') ? [tokenSymbol] : tokenSymbol;
        this.chainName = chainName;
      });
  }

  public async subscribeStorage(storageKeys: string[], formatter: ([reference, change]: Vec<KeyValueOption>) => any, callback: (rs: any) => void) {
    await this.chainInfoIsReady;
    // Force stop while request is not ready
    let forceStop = false;
    const subProm = this.provider.subscribe('state_storage', 'state_subscribeStorage', [storageKeys], (_, value) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      const rs = value?.changes.map(formatter);
      if (!forceStop) {
        callback(rs);
      }
    });

    return () => {
      forceStop = true;
      subProm
        .then((unsubKey) => {
          this.provider.unsubscribe('state_storage', 'state_unsubscribeStorage', unsubKey)
            .catch(console.log);
        })
        .catch(console.log);
    };
  }

  public async queryStorageAt(storageKeys: string[]) {
    await this.isReady;
    return this.provider.send('state_queryStorageAt', [storageKeys]);
  }

  public async subscribeBalance(addresses: string[], callback: (rs: FrameSystemAccountInfo[]) => void) {
    const storageKeys = addresses.map((address) => (concatHash(...methodHash('System', 'Account'), hashAddress(address))));
    return this.subscribeStorage(storageKeys, balanceFormatter, callback).catch(console.error);
  }

  public async getBalance(addresses: string[]) {
    const balanceData = await new Promise<FrameSystemAccountInfo[]>((resolve, reject) => {
      this.subscribeBalance(addresses, (rs) => {
        resolve(rs);
      }).then((unsub) => {
        // unsub && unsub();
      }).catch(reject);
    });

    return balanceData.map(({data}) => {
      return {
        free: data.free?.toString() || '0',
        reserved: data.reserved?.toString() || '0',
        frozen: data.frozen?.toString() || '0',
        flags: data.flags?.toString() || '0',
      };
    });
  }

  public async getBalanceSingle(address: string) {
    const balanceData = await this.getBalance([address]);

    return balanceData[0];
  }
}