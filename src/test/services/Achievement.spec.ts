import {
  AccountLoginLog,
  AccountParams,
  Achievement,
  AchievementLog,
  AchievementMilestone,
  ComparisonOperator,
  Condition,
  ConditionsCombination,
  Metric, ProgressData, RepeatableType, TaskCategory, TaskCategoryType,
} from '@src/models';
import {LeaderboardType} from '@src/services/leaderboards/BaseLeaderBoard';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {AccountService} from '@src/services/AccountService';
import {GameService} from '@src/services/game/GameService';
import {AchievementType} from '@src/services/AchievementService';

async function wait(millis: number) {
  await new Promise(r => setTimeout(r, millis));
}

async function createAchievement(slug: string, leaderBoardType: LeaderboardType, type: AchievementType, value?: number) {
  const metricData = [
    {
      type: leaderBoardType,
      metricId: 'metric-1',
    },
  ] as Metric[];

  const category = await TaskCategory.create({
    'name': slug,
    'description': slug,
    'icon': 'icon',
    'documentId': 'documentId',
    'slug': slug,
    'type': TaskCategoryType.DAILY,
  } as TaskCategory);

  const achievement = await Achievement.create({
    'name': slug,
    'description': slug,
    'icon': 'icon',
    'documentId': 'documentId',
    'achievementCategoryId': category.id,
    'taskCategoryId': category.id,
    'repeatable': RepeatableType.DAILY,
    'metrics': metricData,
    'slug': slug,
  } as unknown as Achievement);
  
  const milestone = await AchievementMilestone.create({
    'achievementId': achievement.id,
    'metricId': 'metric-1',
    'nps': 100,
    'name': slug +' Milestone',
    'documentId': 'documentId',
    'conditions_combination': ConditionsCombination.AND,
    conditions: [
      {
        metric: 'metric-1',
        comparison: ComparisonOperator.GT,
        value: value,
      },
    ] as Condition[],
  } as unknown as AchievementMilestone);
  return {achievement, milestone};
}

describe('Achievement Test', () => {
  const accountService = AccountService.instance;
  const gameService = GameService.instance;
  const info: AccountParams = {
    address: '5Eo5BJntLSFRYGjzEedEguxVjH7dxo1iEXUCgXJEP2bFNHSo',
    signature: '0x660b13c0908541dcfdde53c0cb98e37ac47e4cd4d032941e53b51aac593ed81b8ec5c0ac6123c3c51bd08f1ae7b88afda838314d6727bb0dc6b0d1ad5b18438a',
    telegramId: 12345699909987,
    telegramUsername: 'john_doe',
    firstName: 'John',
    lastName: 'Doe',
    photoUrl: 'https://via.placeholder.com/300x300',
    languageCode: 'en',
  };

  beforeAll(async () => {
    await SequelizeServiceImpl.syncAll();
    await SequelizeServiceImpl.truncateDB();
  });

  afterAll(async () => {
    // await SequelizeServiceImpl.sequelize.close();
  });
  
  it('Achievement Test Game Action', async function () {
    const {achievement, milestone} = await createAchievement('Game Achievement', LeaderboardType.GAME_CASUAL_QUANTITY, AchievementType.GAME, 20);
    const defaultGame = await gameService.generateDefaultData();

    let account = await accountService.findByAddress(info.address);

    if (!account) {
      account = await accountService.createAccount(info);
    }

    // Play game
    const newGame = await gameService.newGamePlay(account.id, defaultGame.id);

    // Submit game
    await gameService.submitGameplay({
      gamePlayId: newGame.id,
      signature: '0x000',
      point: 10,
    });

    // Play game
    const newGame1 = await gameService.newGamePlay(account.id, defaultGame.id);

    // Submit game
    await gameService.submitGameplay({
      gamePlayId: newGame1.id,
      signature: '0x000',
      point: 10,
    });

    // Play game
    const newGame2 = await gameService.newGamePlay(account.id, defaultGame.id);

    // Submit game
    await gameService.submitGameplay({
      gamePlayId: newGame2.id,
      signature: '0x000',
      point: 10,
    });

    // Wait for achievement to be processed
    await wait(2000);
    const log = await AchievementLog.findOne({where: {accountId: account.id, achievementMilestoneId: milestone.id, achievementId: achievement.id}});
    expect(log !== null).toEqual(true);
    if (log){
      const progress: ProgressData[] = log.progress;
      if (progress) {
        expect(progress[0].completed).toEqual(3);
      }
    }
  });

  it('Achievement Test Game Nps Action', async function () {
    const {achievement, milestone} = await createAchievement('Game Achievement', LeaderboardType.GAME_CASUAL_NPS, AchievementType.GAME, 200);
    const defaultGame = await gameService.generateDefaultData();

    let account = await accountService.findByAddress(info.address);

    if (!account) {
      account = await accountService.createAccount(info);
    }

    // Play game
    const newGame = await gameService.newGamePlay(account.id, defaultGame.id);

    // Submit game
    await gameService.submitGameplay({
      gamePlayId: newGame.id,
      signature: '0x000',
      point: 60,
    });

    // Play game
    const newGame1 = await gameService.newGamePlay(account.id, defaultGame.id);

    // Submit game
    await gameService.submitGameplay({
      gamePlayId: newGame1.id,
      signature: '0x000',
      point: 10,
    });

    // Play game
    const newGame2 = await gameService.newGamePlay(account.id, defaultGame.id);

    // Submit game
    await gameService.submitGameplay({
      gamePlayId: newGame2.id,
      signature: '0x000',
      point: 10,
    });

    // Wait for achievement to be processed
    await wait(2000);
    const log = await AchievementLog.findOne({where: {accountId: account.id, achievementMilestoneId: milestone.id, achievementId: achievement.id}});
    expect(log !== null).toEqual(true);
    if (log){
      const progress: ProgressData[] = log.progress;
      if (progress) {
        expect(progress[0].completed).toEqual(80);
      }
    }
  });

  it('Achievement Test Login Action', async function () {
    const {achievement, milestone} = await createAchievement('Daily Achievement', LeaderboardType.ACCOUNT_DAILY_QUANTITY, AchievementType.LOGIN, 2);
    // Create new account
    let account = await accountService.findByAddress(info.address);

    if (!account) {
      account = await accountService.createAccount(info);
    }

    // Create login log for 8 days
    for (let i = 10; i > 2; i--) {
      const now = new Date();
      const today = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i);
      await AccountLoginLog.create({
        accountId: account.id,
        loginDate: today,
        ip: '1',
        country: 'vn',
      });
      await AccountLoginLog.create({
        accountId: account.id,
        loginDate: today,
        ip: '1',
        country: 'vn',
      });
    }

    // Listing game
    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)';
    const currentUser = await accountService.syncAccountData(info, '', '', '', userAgent, false);

    // Wait for achievement to be processed
    await wait(2000);
    const log = await AchievementLog.findOne({where: {accountId: currentUser.id, achievementMilestoneId: milestone.id, achievementId: achievement.id}});
    expect(log !== null).toEqual(true);
    console.log('Achievement Test Login Action Done');
  });

  it('Achievement Test Login 2 day', async function () {
    const {achievement, milestone} = await createAchievement('Daily 2 days Achievement', LeaderboardType.ACCOUNT_DAILY_QUANTITY, AchievementType.LOGIN, 2);
    // Create new account
    let account = await accountService.findByAddress(info.address);

    if (!account) {
      account = await accountService.createAccount(info);
    }
    // Create login log for 2 days once
    for (let i = 10; i > 2; i--) {
      if (i % 2 === 0) {
        // i++;
        continue;
      }
      const now = new Date();
      const today = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i);
      await AccountLoginLog.create({
        accountId: account.id,
        loginDate: today,
        ip: '1',
        country: 'vn',
      });
    }

    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)';
    const currentUser = await accountService.syncAccountData(info, '','', '', userAgent, false);

    // Wait for achievement to be processed
    await wait(2000);
    const log = await AchievementLog.findOne({where: {accountId: currentUser.id, achievementMilestoneId: milestone.id, achievementId: achievement.id}});
    expect(log !== null).toEqual(false);
    console.log('Achievement Test Login 2 days Done');
  });

  it('Achievement Test Login 20 day', async function () {
    const {achievement, milestone} = await createAchievement('Daily 20 days Achievement', LeaderboardType.ACCOUNT_DAILY_QUANTITY, AchievementType.LOGIN, 20);
    // Create new account
    let account = await accountService.findByAddress(info.address);

    if (!account) {
      account = await accountService.createAccount(info);
    }
    // Create login log for 2 days once
    for (let i = 10; i > 2; i--) {
      if (i % 2 === 0) {
        // i++;
        continue;
      }
      const now = new Date();
      const today = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i);
      await AccountLoginLog.create({
        accountId: account.id,
        loginDate: today,
        ip: '1',
        country: 'vn',
      });
    }

    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)';
    const currentUser = await accountService.syncAccountData(info, '','', '', userAgent, false);

    // Wait for achievement to be processed
    await wait(2000);
    const log = await AchievementLog.findOne({where: {accountId: currentUser.id, achievementMilestoneId: milestone.id, achievementId: achievement.id}});
    expect(log !== null).toEqual(false);
    console.log('Achievement Test Login 2 days Done');
  });
});
