import {AchievementCenterService} from '@src/services/AchievementCenterService';


describe('General Test', () => {
  const achievementCenterService = AchievementCenterService.instance;

  beforeAll(async () => {
  });

  afterAll(async () => {
    // await SequelizeServiceImpl.sequelize.close();
  });
  
  it('Achievement Basic Action', async function () {
    await AchievementCenterService.instance.checkAccountAchievement(Math.random(), 1);
  });
});
