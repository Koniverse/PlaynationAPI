import SequelizeServiceImpl from '@src/services/SequelizeService';

describe('NftCollection Test', () => {
  beforeAll(async () => {
    await SequelizeServiceImpl.syncAll();
    // await NftMintRequest.truncate({cascade: true});
    // await NftCampaign.truncate({cascade: true});
    // await NftCollection.truncate({cascade: true});
    // await User.truncate({cascade: true});
  });

  it('Create Basic Info', async function () {

  });
});