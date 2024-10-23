import { CardInfo } from '@koniverse/telegram-bot-grpc';
import { createPromise } from '@src/utils';
import { GameInfo, RoundInfo } from '@src/services/game/mythicalGame/MythicalCardGameService';

export const playGameMiddleware =  async (game: GameInfo, cardToSelectedOfEachRound: string) : Promise<RoundInfo> => {
  const { cardPlayerSelected, rounds, seedEvent } = game;
  ++game.currentRound;

  if (game.currentRound <= rounds.length) {
    let round: RoundInfo = {...rounds[game.currentRound - 1]};
    round.state = 'ready';
    round.cardPlayer =  await selectCardPlayerToPlayRoundMiddleware(
      cardToSelectedOfEachRound,
      cardPlayerSelected,
      round);
    round.state = 'active';
    round = await compareCardPlayerWithOpponentMiddleware(round);

    if(round.isWin && game.bonusPoints) {
      let bonusPoint = 0;
      game.bonusPoints.forEach((bonus) => {
        const isBonusRound =
          Object.keys(bonus.conditions).every(
            (stat) => round.cardPlayer ?
              round.cardPlayer[stat as keyof CardInfo] === bonus.conditions[stat]  : false);
        if (isBonusRound) {
          bonusPoint += bonus.point * round.score;
        }
      });
      round.score += bonusPoint;
    }

    console.log('LOG: Score reward', round.score, game.currentRound);
    if (round.state === 'active') {
      round.state = 'finished';
      game.rounds[game.currentRound - 1] = round;

      if (game.currentRound === rounds.length ) {
        console.log('LOG: Game finished');
        game.state = 'finished';
        // if(round.isWin){
        //   event?.emit('onRoundWin', round, player.cardsPlayGame);
        // } else {
        //   event?.emit('onRoundLose', round, player.cardsPlayGame);
        // }
        // event?.emit('onGameFinished', game);
      } else {
        console.log('LOG: Ready next round');
        // cardsPlayGame = player.cardsPlayGame.filter((card) => card.defId !== round.cardPlayer?.defId);


        // if(round.isWin){
        //   event?.emit('onRoundWin', round, player.cardsPlayGame);
        // } else {
        //   event?.emit('onRoundLose', round, player.cardsPlayGame);
        // }
      }

    }
  }

  console.log('LOG: Finish Play Game Middleware');

  return game.rounds[game.currentRound - 1];
};




export const selectCardPlayerToPlayRoundMiddleware =  async (
  cardToSelectedOfEachRound: string,
  cardsPlayGame: CardInfo[], 
  round: RoundInfo): Promise<CardInfo> => {
  const { promise, resolve } = createPromise<CardInfo>();
  console.log('LOG: Waiting for player to select a card', 'Round', round.id);
  const card = cardsPlayGame.find((cardPlayer) => cardPlayer.defId === cardToSelectedOfEachRound);
  
  if (!card) {
    throw new Error('Card already selected');
  }

  console.log('LOG: Player selected card', card, round.state);

  if (round.state === 'ready') {
    resolve(card);
  }



  return promise.then((card) => {
    return card;
  });
};


export const compareCardPlayerWithOpponentMiddleware=  (round: RoundInfo ): Promise<RoundInfo> => {
  const { promise, resolve } = createPromise<RoundInfo>();
  let isWin = false;
  let score = 0;
  if (round.state === 'active' && round.cardPlayer && round.cardOpponent) {
    console.log('LOG: Compare card player with opponent', round.id);
    // event?.emit('onCompareStatCard', {...round});
    const cardPlayerStatPoint = round.stats.reduce(
      (acc, stat) => round.cardPlayer ? acc + (round.cardPlayer[stat] || 0) : acc,
      0);
    const cardOpponentStatPoint = round.stats.reduce(
      (acc, stat) => round.cardOpponent ? acc + (round.cardOpponent[stat] || 0) : acc,
      0);

    if ( cardPlayerStatPoint >= cardOpponentStatPoint) {
      console.log('LOG: Player win round ', round.id);
      isWin = true;
      score = cardPlayerStatPoint;
    } else {
      console.log('LOG: Player lose');
      isWin = false;
    }
  }

  resolve({...round, isWin, score});

  return promise;
};

