import {GamePointLeaderBoard} from '@src/services/leaderboards/GamePointLeaderBoard';

describe('LeaderBoard Test', () => {
  it('Check game Leaderboard', async function () {
    const gameLB = new GamePointLeaderBoard({
      context: {
        games: [7],
      },
    });

    const rs = await gameLB.fetchLeaderBoard(25601);

    console.table(rs);
  });
});