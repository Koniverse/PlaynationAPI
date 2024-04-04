import { TypeRegistry } from '@polkadot/types';
import { decodeAddress, xxhashAsHex } from '@polkadot/util-crypto';
import { getHasher } from '@polkadot/types/metadata/decorate/storage/getHasher';
import { u8aToHex } from '@polkadot/util';
import { Vec } from '@polkadot/types-codec';
import { KeyValueOption } from '@polkadot/types/interfaces/state/types';
export const registry = new TypeRegistry();

const hashCache: Record<string, string> = {};
function __hashMethod(input: string): string {
  const cached = hashCache[input];
  if (!cached) {
    hashCache[input] = xxhashAsHex(input, 128);
  }

  return hashCache[input];
}

export function methodHash(...args: string[]): string[] {
  return args.map(__hashMethod);
}

export function concatHash(...args: string[]) {
  return '0x' + args.map((s) => (s.replace('0x', ''))).join('');
}

export const Blake2_128Concat = getHasher(registry.createType('StorageHasher', 'Blake2_128Concat'));

export function hashAddress (address: string) {
  return u8aToHex(Blake2_128Concat(decodeAddress(address)), undefined, false);
}

const FrameSystemAccountInfoJSON = JSON.stringify({'nonce':'u32','consumers':'u32','providers':'u32','sufficients':'u32','data':{'free':'u128','reserved':'u128','miscFrozen':'u128','feeFrozen':'u128'}});

export const balanceFormatter = ([storageKey, value]: Vec<KeyValueOption>) => {
  return registry.createType(FrameSystemAccountInfoJSON, value) ;
};


