import fetch from 'node-fetch';
import {RMRKCollectionInfo, RMRKMetadata, RMRKMintInput} from '@src/types';
import '@polkadot/types-augment';
import ChainServiceImpl from '@src/services/ChainService';
import * as console from 'console';
import logger from 'jet-logger';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {autoResolveIPFS} from '@src/utils/ipfs';
import {Collection} from 'rmrk-tools';
import {generateRandomString} from '@src/utils';
import Web3StorageServiceImpl from '@src/services/Web3StorageService';

export class RMRKService {

  private apiEndpoint = 'https://singular.app/api/rmrk2';

  public async getCollectionInfo(id: string) {
    try {
      // Get collection info
      const url = `${this.apiEndpoint}/collection/${id}`;
      const collectionInfos = await fetch(url)
        .then((res) => (res.json() as unknown as RMRKCollectionInfo[]));

      const collectionInfo = collectionInfos[0];

      // Get metadata
      if (collectionInfo.metadata) {
        collectionInfo.metadataContent = await fetch(autoResolveIPFS(collectionInfo.metadata))
          .then((res) => res.json() as unknown as RMRKMetadata);
      }

      return collectionInfo;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  public async createCollection(input: RMRKMetadata & {max?: number}) {
    const {max, ...metadata} = input;
    const address = await ChainServiceImpl.getKeypairAddress();
    const publicKey = await ChainServiceImpl.getKeypairPublicKey();
    const latestBlockNumber = await ChainServiceImpl.getLatestBlockNumber();

    // Geneate information
    const symbol = generateRandomString('SW', 4);
    const id = Collection.generateId(publicKey, symbol);

    // Upload metadata
    const cid = await Web3StorageServiceImpl.uploadJson(metadata, id);
    const metadataUri = `ipfs://ipfs/${cid}`;

    // Create transaction
    const collection = new Collection(0, max || 0, address, symbol, id, metadataUri);
    const remarkData = collection.create();
    await this.runRemarkExtrinsic(remarkData);

    return id;
  }

  public async getNftInfo(id: string) {
    try {
      // Get collection info
      const url = `${this.apiEndpoint}/nft/${id}`;
      const nftInfos = await fetch(url)
        .then((res) => (res.json() as unknown as RMRKCollectionInfo[]));

      const nftInfo = nftInfos[0];


      return nftInfo;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  public async runRemarkExtrinsic(remarkData: string) {
    const api = await ChainServiceImpl.getApi();
    const extrinsic = api.tx.system.remark(remarkData);

    return await ChainServiceImpl.runExtrinsic(extrinsic);
  }

  public async mintNFT(rmrkCollectionId: string, recipient: string, customMetadata: RMRKMetadata | string) {
    const index = await SequelizeServiceImpl.nextVal(rmrkCollectionId);
    const sn = index.toString().padStart(8, '0');
    const collectionSymbol = rmrkCollectionId.split('-')[1];
    const symbol = index.toString().padStart(6, '0');

    let metadata = typeof customMetadata === 'string' ? customMetadata : '';
    if (typeof customMetadata !== 'string') {
      // Upload json and get metadata
      if (customMetadata.name) {
        customMetadata.name = `${customMetadata.name} #${index}`;
      }
      const cid = await Web3StorageServiceImpl.uploadJson(customMetadata, `nft-${index}`);
      metadata = `ipfs://ipfs/${cid}`;
    }

    const mintData: RMRKMintInput = {
      collection: rmrkCollectionId,
      symbol,
      transferable: 1,
      sn,
      metadata,
    };

    logger.info(`Minting NFT: SN: ${mintData.sn} | Collection: ${mintData.collection} | Address: ${recipient} || Metadata: ${metadata}`);

    // URL encode mintData
    const encoded = encodeURI(JSON.stringify(mintData));
    const remarkData = `rmrk::MINT::2.0.0::${encoded}::${recipient}`;

    // Send and listen to extrinsic
    const mintInfo = await this.runRemarkExtrinsic(remarkData);

    return {
      ...mintData,
      ...mintInfo,
      metadata,
      symbol,
    };
  }

}

const RMRKServiceImpl = new RMRKService();
export default RMRKServiceImpl;