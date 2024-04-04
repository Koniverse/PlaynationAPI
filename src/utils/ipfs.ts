import fetch from 'node-fetch';

const RMRK_IPFS = ['https://ipfs.rmrk.link/ipfs', 'https://ipfs2.rmrk.link/ipfs'];
export function autoResolveIPFS(url: string) {
  if (url.startsWith('ipfs://')) {
    // Random selection of ipfs endpoint
    const endpoint = RMRK_IPFS[Math.floor(Math.random() * RMRK_IPFS.length)];
    const cid = url.replace('ipfs://ipfs/', '').replace('ipfs://', '');

    return `${endpoint}/${cid}`;
  }

  return url;
}

export async function getMetadata<T>(cid: string) {
  const url = autoResolveIPFS(cid);
  return await fetch(url).then((res) => res.json() as unknown as T);
}