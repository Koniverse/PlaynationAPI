import {AchievementCenterService} from '@src/services/AchievementCenterService';


describe('General Test', () => {
  const achievementCenterService = AchievementCenterService.instance;

  beforeAll(async () => {

  });

  afterAll(async () => {
    // await SequelizeServiceImpl.sequelize.close();
  });
  
  it('Achievement Basic Action', async function () {
    jest.setTimeout(6000000);
    const check = await AchievementCenterService.instance.checkAccountAchievement(24444, 1);
    console.log(check);
  });
});
