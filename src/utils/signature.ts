import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import {decodeAddress, isAddress, isEthereumAddress, signatureVerify} from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

export function validateSignature(address: string, signedMessage: string, signature: string): boolean {
  try {
    if (!isAddress(address)) {
      return false;
    }

    if (isEthereumAddress(address)) {
      const recoveredAddress = recoverPersonalSignature({
        data: signedMessage,
        signature,
      });

      return recoveredAddress.toLocaleLowerCase() === address.toLocaleLowerCase();
    }

    return signatureVerify(signedMessage, signature, address).isValid;
  } catch (e) {
    return false;
  }
}