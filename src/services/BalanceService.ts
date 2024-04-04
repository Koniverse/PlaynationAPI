import fetch from 'node-fetch';
import {SimpleBalanceItem, SubscanBalanceItem, SubscanResponse} from '@src/types';
import EnvVars from '@src/constants/EnvVars';
import {LightConnector} from '@src/api/substrate-light-api';
import {ChainInfoMap} from '@subwallet/chain-list';
import logger from 'jet-logger';

export class BalanceService {
  private lightConnectorMap: Record<string, LightConnector> = {};

  public constructor() {
    const chainList = EnvVars.CHECK_BALANCE_NETWORKS.split(',');
    if (EnvVars.CHECK_BALANCE_NETWORKS !== '' && chainList.length) {
      for (const chain of chainList) {
        const chainInfo = ChainInfoMap[chain];
        const endpoints = Object.values(chainInfo.providers).filter((x) => x.startsWith('wss://'));
        if (chainInfo && endpoints.length) {
          this.lightConnectorMap[chain] = new LightConnector(chain, endpoints);
        } else {
          logger.warn(`Chain ${chain} is not supported`);
        }
      }
    }
  }

  public async getLightweightBalance(address: string): Promise<SimpleBalanceItem[]> {
    const promises: Promise<SimpleBalanceItem>[] = [];
    Object.entries(this.lightConnectorMap).forEach(([chain, lightConnector]) => {
      const data = Promise.race([lightConnector.getBalanceSingle(address),
        new Promise((resolve) => setTimeout(() => {
          resolve({});
        }, 9000))])
        .then((rs) => ({...rs as SimpleBalanceItem, network: chain}));

      promises.push(data);
    });

    return await Promise.all(promises);
  }

  public async getBalance(address: string): Promise<SubscanBalanceItem[]> {
    const rs = await fetch(
      `${EnvVars.SUBSCAN_URL}/api/scan/multiChain/account`,
      {
        headers: {
          ...EnvVars.SUBSCAN_HEADER,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({address: address}),
      }).then(response => response.json()) as SubscanResponse<SubscanBalanceItem[]>;

    return rs?.data || [];
  }

  public async checkBalance(address: string) {
    const balanceData = await this.getBalance(address);
    const directBalance = await this.getLightweightBalance(address);

    // Check if balance is zero
    const hasBalance = balanceData
      .some(balance => {
        return (balance.balance && balance.balance !== '0')
          || (balance.locked && balance.locked !== '0')
          || (balance.reserved && balance.reserved !== '0')
          || (balance.bonded && balance.bonded !== '0')
          || (balance.unbonding && balance.unbonding !== '0')
          || (balance.democracy_lock && balance.democracy_lock !== '0')
          || (balance.election_lock && balance.election_lock !== '0')
          || (balance.nomination_bonded && balance.nomination_bonded !== '0');
      });

    const haveDirectBalance = directBalance.some(balance => (balance.free && balance.free !== '0' || balance.reserved && balance.reserved !== '0'));

    return [hasBalance || haveDirectBalance, balanceData.concat(directBalance  as SubscanBalanceItem[])];
  }
}

export const BalanceServiceImpl = new BalanceService();