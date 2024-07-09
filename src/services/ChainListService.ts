import {ChainService} from '@src/services/ChainService';
import {keyring} from '@polkadot/ui-keyring';
import {ChainAssetMap, ChainInfoMap} from '@subwallet/chain-list';
import EnvVars from '@src/constants/EnvVars';
import {BN} from '@polkadot/util';
import {isAddress} from '@polkadot/util-crypto';

export interface CreateTransactionParams {
    address: string;
    network: string;
    decimal: number;
    amount: number;
    token_slug?: string;
}

export interface CreatePAAirdropTransactionParams extends CreateTransactionParams {
    assetId: string;
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

  public getService (network: string) {
    const chainService = this.chainServiceList[network];
    if (!chainService) {
      throw new Error(ErrorTransfer.ERR_INCORRECT_NETWORK);
    }

    return chainService;
  }

  private validateAddress (address: string) {
    const checkAddress = isAddress(address);
    if (!checkAddress) {
      throw new Error(ErrorTransfer.ERR_INVALID_WALLET_ADDRESS);
    }
  }

  public async createTransfer(address: string, network: string, decimal: number, amount: number, token_slug?: string) {
    const isAssetHubNetworks = ['statemint', 'statemine', 'rococo'].includes(network);

    if (token_slug && isAssetHubNetworks) {
      const tokenInfo = ChainAssetMap[token_slug];
      if (tokenInfo && tokenInfo?.metadata?.assetId) {
        return await this.createPolkadotAssetHubTokenTransfer(address, network, tokenInfo.metadata.assetId, decimal, amount);
      }
    }

    return await this.createNativeTokenTransfer(address, network, decimal, amount);
  }

  public async createNativeTokenTransfer(address: string, network: string, decimal: number, amount: number) {
    this.validateAddress(address);
    const chainService = this.getService(network);
    const api = await chainService.getApi();
    const airdropAccount = (amount - EnvVars.ChainService.estimatedFee) * 10 ** decimal;

    const AIRDROP_AMOUNT = new BN(airdropAccount);
    const MINIMUM_BALANCE = new BN(EnvVars.ChainService.minimumBalance  * 10 ** decimal);

    const enoughBalance = await chainService.checkMinBalance(chainService.sendAddress, MINIMUM_BALANCE);
    if (!enoughBalance) {
      throw new Error(ErrorTransfer.ERR_MISSING_TOKEN);
    }
    const extrinsic = api.tx.balances.transferKeepAlive(address, AIRDROP_AMOUNT);

    return await chainService.runExtrinsic(extrinsic);
  }

  private minBalanceFaucetMap: Record<string, boolean> = {};

  public async createPolkadotAssetHubTokenTransfer(address: string, network: string, assetId: string, decimal: number, amount: number) {
    this.validateAddress(address);
    const chainService = this.getService(network);
    const api = await chainService.getApi();
    await api.isReady;

    // Validate current sender balance
    const MINIMUM_BALANCE = new BN(EnvVars.ChainService.minimumBalance  * 10 ** decimal);
    const enoughBalance = await chainService.checkMinBalance(chainService.sendAddress, MINIMUM_BALANCE);
    const enoughTokenBalance = await chainService.checkMinTokenBalance(assetId, chainService.sendAddress, new BN(amount * 10 ** decimal));

    if (!enoughBalance || !enoughTokenBalance) {
      throw new Error(ErrorTransfer.ERR_MISSING_TOKEN);
    }

    // Check and give ED for receiver
    const haveMinBalance = await chainService.checkMinBalance(address, new BN(0.01 * 10 ** decimal));

    // User faucetKey to avoid send faucet multiple times
    const faucetKey = `${network}-${address}`;
    if (!haveMinBalance && !this.minBalanceFaucetMap[faucetKey]) {
      this.minBalanceFaucetMap[faucetKey] = true;
      const edAmount = new BN(0.013 * 10 ** decimal);
      const edExtrinsic = api.tx.balances.transferKeepAlive(address, edAmount);
      const promise1 = chainService.runExtrinsic(edExtrinsic);
    }

    // Create airdrop transaction
    const airdropAmount = new BN(amount * 10 ** decimal);
    const tokenExtrinsic = api.tx.assets.transfer(assetId, address, airdropAmount);
    const promise2 = chainService.runExtrinsic(tokenExtrinsic);

    return await promise2;
  }
}

export const ChainListServiceImpl = new ChainListService();
