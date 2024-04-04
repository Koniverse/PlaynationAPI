import '../setup/setupTestEnvironment';
import SequelizeServiceImpl from './SequelizeService';

describe('Test SequelizeService', () => {
  beforeAll(async () => {
    await SequelizeServiceImpl.syncAll();
  });

  it('should be able to create a new user', async () => {
    const nextVal = await SequelizeServiceImpl.nextVal('test-key');

    expect(nextVal).toBeGreaterThan(0);
  });
});