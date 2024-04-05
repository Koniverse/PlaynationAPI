import {isEthereumAddress} from '@polkadot/util-crypto';
import { WalletTypeEnum } from '@src/models/Account';

export function checkWalletType(address: string): WalletTypeEnum | undefined {
  try {
    return isEthereumAddress(address) ? WalletTypeEnum.EVM : WalletTypeEnum.SUBSTRATE;
  } catch (e) {
    return undefined;
  }
}