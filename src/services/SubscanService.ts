import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import EnvVars from '@src/constants/EnvVars';
import fetch from 'node-fetch';
import {createPromise, PromiseObject} from '@src/utils';
import {v4} from 'uuid';

type SubscanRequestParams = unknown;

interface SubscanAction {
  id: string,
  action: string;
  network: string;
  data: SubscanRequestParams;
  promiseHandler: PromiseObject<any>
}

const MAP_NETWORK = {
  'alephTest': 'alephzero-testnet',
  'polkadot': 'polkadot',
  'kusama': 'kusama',
  'goldberg_testnet': 'goldberg_testnet',
  'karura': 'karura',
  'acala': 'acala',
  'vara_network': 'vara',
  'creditcoinTest': 'creditcoin3-testnet',
  'creditcoin': 'creditcoin',
} as Record<string, string>;

export class SubscanService {
  private actionQueue: Record<string, SubscanAction> = {};
  private isRunning = false;

  constructor(private sequelizeService: SequelizeService) {}
  getActionUrl(network: string, action: string){
    const slug = MAP_NETWORK[network] ||  network;
    return `https://${slug}.api.subscan.io${action}`;
  }

  public async addAction<T>(network: string, action: string, data: unknown) {
    const promiseHandler = createPromise<T>();

    const actionObj: SubscanAction = {
      id: v4(),
      action,
      network,
      data,
      promiseHandler,
    };

    this.actionQueue[actionObj.id] = actionObj;
    this.process();

    return promiseHandler.promise;
  }

  private process() {
    if (this.isRunning) {
      return;
    }

    const processInterval = setInterval(() => {
      if (Object.keys(this.actionQueue).length === 0) {
        clearInterval(processInterval);
        this.isRunning = false;
        return;
      }

      // Get TELEGRAM_RATE_LIMIT messages and send
      const actions = Object.values(this.actionQueue).slice(0, EnvVars.Subscan.RateLimit);
      actions.forEach(({id,network, action, data, promiseHandler}) => {
        this.runAction(action, network, data)
          .then(promiseHandler.resolve)
          .catch(promiseHandler.reject);

        delete this.actionQueue[id];
      });
    }, EnvVars.Subscan.IntervalTime);

    this.isRunning = true;
  }

  async runAction<T>(action: string, network: string, data: any){
    const url = this.getActionUrl(network, action);
    const response = await fetch(
      url,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(data),
        redirect: 'follow',
      });

    return (await response.json()) as T;
  }

  // Singleton this class
  private static _instance: SubscanService;
  public static get instance() {
    if (!this._instance) {
      this._instance = new SubscanService(SequelizeServiceImpl);
    }

    return this._instance;
  }
}
