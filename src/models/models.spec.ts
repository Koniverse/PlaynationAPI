import '../setup/setupTestEnvironment';
import {AccountType, NetworkType, NftMintRequestStatus} from '@src/types';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {NftCampaign, NftCollection, NftMintRequest, User} from '@src/models';
import RMRKServiceImpl from '@src/services/RMRKService';
import EnvVars from '@src/constants/EnvVars';
import {autoResolveIPFS} from '@src/utils/ipfs';
import * as console from 'console';

describe('NftCollection Test', () => {
  beforeAll(async () => {
    await SequelizeServiceImpl.syncAll();
    await NftMintRequest.truncate({cascade: true});
    await NftCampaign.truncate({cascade: true});
    await NftCollection.truncate({cascade: true});
    await User.truncate({cascade: true});
  });

  it('Create Basic Info', async function () {
    // Wait 3 seconds for the database to be ready
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const collectionInfo = await RMRKServiceImpl.getCollectionInfo(EnvVars.DefaultData.RMRKCollectionId);
    console.log(collectionInfo);
    if (collectionInfo?.metadataContent) {
      const {name, description, mediaUri} = collectionInfo.metadataContent;
      const nftImage = autoResolveIPFS(mediaUri);
      const collection = await NftCollection.create({
        rmrkCollectionId: collectionInfo.id,
        name,
        description,
        image: nftImage,
        network: 'kusama',
        networkType: NetworkType.SUBSTRATE,
        networkName: 'Kusama',
        nftMetadata: JSON.stringify({}),
      });

      const campaign = await NftCampaign.create({
        collectionId: collection.id,
        name: 'Campaign 01',
        description: 'Campaign 01',
        image: nftImage,
        startTime: new Date('2023-01-01'),
        endTime: new Date('2023-12-31'),
      });

      const user = await User.create({
        address: '5EyJs5PHhpSSF3CfvREwGahBk2A7LaEdAqEKnm1RzpP7Nuq4',
        name: 'Demo User',
        type: AccountType.SUBSTRATE,
        randomCode: '780b8f78-779b-41d9-9c37-52a1a71ec465',
      });

      const mintRequest = await NftMintRequest.create({
        campaignId: campaign.id,
        collectionId: collection.id,
        userId: user.id,
        address: user.address,
        signature: '0x1611f311ad1320ac75e0e14ad9304bd9a0f70ba2836df1ed689e9f711bf266590e45ef2656fb3a8432ba7e39ed73744e7bd4bcd933c0616959f3a06297465986',
        status: NftMintRequestStatus.CHECKED,
        balanceData: JSON.stringify({}),
        mintCategory: '__default',
      });

      expect((await collection.getNftCampaigns()).length).toBeGreaterThan(0);
      expect(await collection.countNftMintRequests()).toBeGreaterThan(0);
      expect(mintRequest.getCollection).not.toBeNull();
    }
  });
});