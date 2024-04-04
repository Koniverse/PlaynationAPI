import '../setup/setupTestEnvironment';
import RMRKServiceImpl from '@src/services/RMRKService';
import {NftCampaign, NftCollection} from '@src/models';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import EnvVars from '@src/constants/EnvVars';
import {InferCreationAttributes} from 'sequelize';
import {NetworkType, RMRKMetadata} from '@src/types';
import {autoResolveIPFS} from '@src/utils/ipfs';
import {DuplicateCheckType} from '@src/services/type';

jest.setTimeout(60000);

describe('RMRKService', () => {

  it('CreateCollection', async function () {
    const collectionId = await RMRKServiceImpl.createCollection({
      name: 'Polkadot Power Passport',
      description: 'Polkadot Power Passport is the first NFT by DOTinVietnam given to holders of more than sixty projects in the Polkadot ecosystem.',
      mediaUri: 'ipfs://ipfs/bafybeiaeylhnasi27aodom3hve4zx6jzenxumxsaanhxakznmoczjhqmey/thumbnail.jpg',
      thumbnailUri: 'ipfs://ipfs/bafybeiaeylhnasi27aodom3hve4zx6jzenxumxsaanhxakznmoczjhqmey/thumbnail.jpg',
      external_url: 'ipfs://ipfs/bafybeiaeylhnasi27aodom3hve4zx6jzenxumxsaanhxakznmoczjhqmey/thumbnail.jpg',
      max: 0,
      properties: {},
    });
    console.log(collectionId);
  });

  it('MintNFT', async function () {
    const rs = await RMRKServiceImpl.mintNFT('80971274db0b27d618-SWLOKA', '5FL348ru1t5PJQUTdERuxa6StMs3tDrhTW71AEfAYYUUg1Sg', {
      name: 'VIP',
      description: 'The VIP in the collection',
      mediaUri: 'ipfs://ipfs//bafybeiaeylhnasi27aodom3hve4zx6jzenxumxsaanhxakznmoczjhqmey/dotinvietnam-passport.mp4',
      thumbnailUri: 'ipfs://ipfs//bafybeiaeylhnasi27aodom3hve4zx6jzenxumxsaanhxakznmoczjhqmey/dotinvietnam-passport.mp4',
      external_url: 'ipfs://ipfs//bafybeiaeylhnasi27aodom3hve4zx6jzenxumxsaanhxakznmoczjhqmey/dotinvietnam-passport.mp4',
    });
    console.log(rs);
  });
  
  it('SyncCollection', async () => {
    const collectionId = EnvVars.DefaultData.RMRKCollectionId;
    const collectionInfo = await RMRKServiceImpl.getCollectionInfo(collectionId);
    if (!collectionInfo) {
      return;
    }

    await SequelizeServiceImpl.syncAll();
    const existed = await NftCollection.findOne({where: {rmrkCollectionId: collectionId}});
    const collectionImage = autoResolveIPFS(collectionInfo.metadataContent?.mediaUri || 'https://via.placeholder.com/800x800?text=NFT+Collection');
    
    const nftCIDMap = {
      '__default': 'bafkreiczrch7q37gqthg2cm4nvq5d6lijjx65r6zczgqqd3g25ejdmjqqi',
      'g01': 'bafkreifpsrziv5exsuhwsvwtpat6jrfmh6gvjijhxup7yggrmby3ajauue',
      'g02': 'bafkreia2ab37k4rjhxx6zxw375c4bdlmufrt4fm3ck7d2muhlgvre3ecuq',
      'g03': 'bafkreib577jlpgkvkge4d3iludyvjesmneyilb2ppmvv5zendmyn52ilzi',
      'g04': 'bafkreigz5nqz7ff33uwzs7hjyvtjd7psunkqjd3k3hyo222ro4qrlnqhyq',
      'g05': 'bafkreifc27sg5mdzbc3no666aoka3nmxuzdfihzf6fzjigk3xw4pqu26lu',
      'g06': 'bafkreib5jrs44yxrxcnzg33lrg6gkhg4zlsl2qmwnqucwmudzynml23y6u',
      'g07': 'bafkreichobos5li5blx4q2o44xzoemy2gcmsl7774ru4gxkefgspycepzy',
      'g08': 'bafkreids2bkou7frx6m5jeacpaiv5432fpqovgkbwtvbpqlarfdjuv2lla',
      'g09': 'bafkreiczrch7q37gqthg2cm4nvq5d6lijjx65r6zczgqqd3g25ejdmjqqi',
      'g10': 'bafkreieyliiaz4bju5ngjzle76rrc5eaer4xnr5jtld7yiiggo2toas6mi',
    };
    const nftMetadata: Record<string, RMRKMetadata> = {};
    Object.entries(nftCIDMap).forEach(([key, value]) => {
      nftMetadata[key] = {
        name: 'Glass',
        description: 'Glass Art Generate with AI Program',
        mediaUri: `ipfs://ipfs/${value}`,
        thumbnailUri: `ipfs://ipfs/${value}`,
        image: `ipfs://ipfs/${value}`,
      };
    });

    const data : Omit<InferCreationAttributes<NftCollection>, 'id' | 'minted'> = {
      rmrkCollectionId: collectionId,
      name: collectionInfo.metadataContent?.name || collectionId,
      description: collectionInfo.metadataContent?.name || collectionId,
      image: collectionImage,
      network: 'kusama',
      networkType: NetworkType.SUBSTRATE,
      networkName: 'Kusama',
      nftMetadata: JSON.stringify(nftMetadata),
    };
    
    if (existed) {
      await NftCollection.update(data, {where: {rmrkCollectionId: collectionId}});
    } else {
      const newCollection = await NftCollection.create(data);
      
      await NftCampaign.create({
        collectionId: newCollection.id,
        name: 'Campaign 01',
        description: 'Campaign 01',
        image: collectionImage,
        startTime: new Date('2023-01-01'),
        endTime: new Date('2023-12-31'),
        validateWhiteList: false,
        validateOwner: false,
        validateBalance: false,
        duplicateCheck: DuplicateCheckType.CATEGORY,
      });
    }

  });

  afterAll(async () => {
    // await ChainServiceImpl.disconnect();
  });
});