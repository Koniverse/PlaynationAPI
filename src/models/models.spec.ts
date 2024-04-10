import SequelizeServiceImpl from '@src/services/SequelizeService';

describe('NftCollection Test', () => {
  beforeAll(async () => {
    await SequelizeServiceImpl.syncAll();
  });

  it('Create Basic Info', async function () {

  });
});