import {AccountService} from '@src/services/AccountService';
import {Account, Game, GameEvent} from '@src/models';
import {GameService} from '@src/services/game/GameService';
import {QuickGetService} from '@src/services/QuickGetService';
import {GameEventContentCMS, GameEventService} from '@src/services/game/GameEventService';
import SequelizeServiceImpl from '@src/services/SequelizeService';

const accountService = AccountService.instance;
const gameService = GameService.instance;
const quickGetService = QuickGetService.instance;
const gameEventService = GameEventService.instance;

const ACCOUNT_LIST = [{
  address: '5Eo5BJntLSFRYGjzEedEguxVjH7dxo1iEXUCgXJEP2bFNHSo',
  signature: '0x660b13c0908541dcfdde53c0cb98e37ac47e4cd4d032941e53b51aac593ed81b8ec5c0ac6123c3c51bd08f1ae7b88afda838314d6727bb0dc6b0d1ad5b18438a',
  telegramId: 12345699909987,
  telegramUsername: 'first_user',
  firstName: 'First',
  lastName: 'User',
  photoUrl: 'https://via.placeholder.com/300x300',
  languageCode: 'en',
}, {
  address: '5C56a7RAa81CkeFmJFPZmCfXwZ4YALxt6Sx2L5KmF6vos84p',
  signature: '0x660b13c0908541dcfdde53c0cb98e37ac47e4cd4d032941e53b51aac593ed81b8ec5c0ac6123c3c51bd08f1ae7b88afda838314d6727bb0dc6b0d1ad5b18438a',
  telegramId: 1234569990998,
  telegramUsername: 'second_user',
  firstName: 'Second',
  lastName: 'User',
  photoUrl: 'https://via.placeholder.com/300x300',
  languageCode: 'en',
}, {
  address: '5C56a7RAa81CkeFmJFPZmCfXwZ4YALxs6Sx2L5KmF6vos84p',
  signature: '0x660b13c0908541dcfdde53c0cb98e37ac47e4cd4d032941e53b51aac593ed81b8ec5c0ac6123c3c51bd08f1ae7b88afda838314d6727bb0dc6b0d1ad5b18438a',
  telegramId: 1234569390998,
  telegramUsername: 'third_user',
  firstName: 'Third',
  lastName: 'User',
  photoUrl: 'https://via.placeholder.com/300x300',
  languageCode: 'en',
}];

const currentDate = new Date();
const yesterdayDate = new Date((new Date()).setDate(currentDate.getDate() - 1));
const tomorrowDate = new Date((new Date()).setDate(currentDate.getDate() + 1));
const prevYearDate = new Date((new Date()).setFullYear(currentDate.getFullYear() - 1));
const nextYearDate = new Date((new Date()).setFullYear(currentDate.getFullYear() + 1));
const GAME_DATA = [{
  id: 1,
  name: 'NFL Rival Game',
  documentId: 'game_01',
  description: 'Demo Game',
  url: '',
  maxEnergy: 300,
  slug: 'nfl_rival_game',
  active: true,
  maxPoint: 1000,
  energyPerGame: 0,
  pointConversionRate: 1,
  maxPointPerGame: 0,
  icon: '',
  rank_definition: '[]',
  banner: '',
  startTime: prevYearDate,
  endTime: nextYearDate,
}];

const GAME_EVENTS: GameEventContentCMS[] = [{
  id: 0,
  documentId: 'event_01',
  name: 'Demo Event 01',
  game: {
    documentId: GAME_DATA[0].documentId,
  },
  icon: '',
  description: '',
  start_time: yesterdayDate,
  end_time: currentDate,
  toss_up_info: {
    stats: ['quickness', 'acceleration', 'presence', 'endurance'],
    opponent_teams: [],
    round: 5,
    difficulty: 6,
    play_duration: 180,
    gameplay_per_event: 2,
  },
  toss_up_bonus: [
    {
      __component: 'mythical.team-bonus',
      program: 'halloween_2023',
      bonus: 5,
      bonus_text: 'Program Bonus 5%',
    },
    {
      __component: 'mythical.team-bonus',
      position: 'FS',
      bonus: 5,
      bonus_text: 'Position FS 5%',
    },
  ],
}];


describe('Mythical Card Game | Full Test', () => {
  const accountList: Account[] = [];

  beforeAll(async () => {
    await SequelizeServiceImpl.isReady;
    // Create 3 Users
    for (const account of ACCOUNT_LIST) {
      let existed = await accountService.findByTelegramId(account.telegramId);
      if (!existed) {
        existed = await accountService.createAccount(account);
      }

      accountList.push(existed);
    }

    expect(accountList.length).toEqual(3);

    // Create 1 Game
    await gameService.syncData(GAME_DATA);

    // Create Game Event
    await gameEventService.sync(GAME_EVENTS);
  });

  it('Play Game', async function () {

    // New Gameplay
    const games = await quickGetService.listGame();
    const gameMap = Object.fromEntries(games.map((game) => [game.documentId, game]));
    const events = await quickGetService.listGameEvent();
    const eventMap = Object.fromEntries(events.map((event) => [event.documentId, event]));
    
    // Todo: Issue-22 | Customize Init Data
    
    const gamePlay = await gameService.newGamePlay({
      accountId: accountList[0].id,
      gameId: gameMap[GAME_DATA[0].documentId].id,
      gameEventId: eventMap[GAME_EVENTS[0].documentId].id,
      gameInitData: {},
    });
    
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Todo: Issue-22 | Customize Init Data
    await gameService.submitGamePlayState(gamePlay.id, {
      signature : '0x',
      timestamp : new Date().toString(),
      data: {},
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Todo: Issue-22 | Submit rounds
    await gameService.submitGamePlayState(gamePlay.id, {
      signature : '0x',
      timestamp : new Date().toString(),
      data: {},
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Todo: Finish Game
    await gameService.submitGamePlayState(gamePlay.id, {
      signature : '0x',
      timestamp : new Date().toString(),
      data: {},
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
  });
})
;
