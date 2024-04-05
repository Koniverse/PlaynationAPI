import {WalletTypeEnum} from '@src/models/Wallet';
import {isEthereumAddress} from '@polkadot/util-crypto';

export function checkWalletType(address: string): WalletTypeEnum | null {
  try {
    return isEthereumAddress(address) ? WalletTypeEnum.EVM : WalletTypeEnum.SUBSTRATE;
  } catch (e) {
    return null;
  }
}