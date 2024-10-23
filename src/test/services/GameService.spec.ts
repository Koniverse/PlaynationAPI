import { GameService } from '@src/services/game/GameService';

const gameService = GameService.instance;
describe('GameService', () => {
  it('should submit state', async function () {
    const lastState = await gameService.getLastState(100, 1);

    const gamePlay = await gameService.newGamePlay(100, 1);

    const data = {a: 1, b: 1, c: 1};
    if (lastState?.state) {
      Object.assign(data, lastState.state);
    }

    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      data.a += 1;
      data.b += 1;
      data.c += 1;
      // const signature = await signPayload(data);
      await gameService.submitGamePlayState(gamePlay.id, {
        data: JSON.stringify(data),
        signature: '0x00000',
        timestamp: new Date().toISOString(),
      });
    }

    console.log('done', data);
  });
});