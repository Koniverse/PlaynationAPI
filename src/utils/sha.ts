import { Sha256 } from '@aws-crypto/sha256-browser';
import { u8aToHex } from '@polkadot/util';

export async function signPayload(payload: any, key?: string) {
  const hash =  new Sha256(key);
  hash.update(typeof payload === 'string' ? payload : JSON.stringify(payload));

  const hashU8a = await hash.digest();

  return u8aToHex(hashU8a);
}

export async function validatePayload(payload: any, signature: string, key?: string) {
  const tryToSign = await signPayload(payload, key);

  if(!signature.startsWith('0x')) {
    signature = '0x' + signature;
  }

  return tryToSign === signature;
}