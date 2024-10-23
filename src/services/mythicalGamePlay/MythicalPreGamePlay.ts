import { GameInfo, CardStat, RoundInfo } from '@src/services/MythicalCardGameService';
import { CardInfo, CardInfo__Output } from '@koniverse/telegram-bot-grpc';
import { EventInfo, MythicalEventService } from '@src/services/MythicalEventService';
import { mythicalCardGameService } from '@src/services/MythicalCardGameService';
import * as console from 'node:console';
import { GRPCService } from '@src/services/GRPCService';


export const CARD_OPPONENT_LENGTH = 5;
export const INITIAL_TOLERANCE_RANGE = 5;

export const preGameMiddleware = async ( 
  cardPlayerSelected: CardInfo[], idPlayer: string, eventGame: EventInfo,
) : Promise<GameInfo> => {
  
  console.log('LOG: Pre Game Middleware');
  const creatAt = new Date().toISOString();
  const cardStore = Object.values(await mythicalCardGameService.getCardMap());
  const idGame = createIDGameMiddleware(eventGame.seedGame, cardPlayerSelected);
  const cardOpponents = getOpponentCardMiddleware(cardStore, cardPlayerSelected, eventGame.opponentTeam);
  const roundGames = createRoundsOfGameMiddleware(cardStore, cardOpponents, eventGame, !!eventGame.opponentTeam);

  const game: GameInfo = {
    id: idGame,
    playerId: idPlayer,
    seedEvent: eventGame.seedGame,
    cardOpponents,
    rounds: roundGames,
    currentRound: 0,
    creatAt,
    state: 'ready',
    bonusPoints: eventGame.bonusPoints,
    cardPlayerSelected,
  };

  console.log('LOG: Finish Pre Game Middleware', game.rounds);

  return game;
};

export const rangeStatGamePlay = (stats: CardStat[], card: CardInfo[]): Record<string, number[]> => {
  return stats.reduce<Record<string, number[]>>((record, stat) => {
    let maxStat = card[0][stat] || 0;
    let minStat = card[0][stat] || 10000000000;
    card.forEach((card) => {
      if (card[stat]) {
        maxStat = Math.max(maxStat, card[stat] || 0);
        minStat = Math.min(minStat, card[stat] || 0);
      }
    });


    record[stat] = [maxStat, minStat];

    return record;
  }, {});
};

export const getOpponentCardRandomList = (
  cardOpponent: CardInfo[], stats: CardStat[],
  idealStat: Record<string, number>,
  toleranceRange: number,
  cardsSelected: CardInfo[],
  maxStatsPoint: number,
  cardOpponentSelectedInEachRound: string[],
  isSpecificCondition?: boolean
): CardInfo[] => {

  for (const card of cardOpponent) {

    if (cardsSelected.find(({defId}) => defId === card.defId) 
      || cardOpponentSelectedInEachRound.includes(card.defId || '')) {
      continue;
    }

    const statsOpponentCombine = stats.reduce((sumStat, stat) => sumStat + (card[stat] as number), 0);
    const idealStatCombine = stats.reduce((sumStat, stat) => sumStat + idealStat[stat], 0);
    const diffStat = Math.abs(statsOpponentCombine - idealStatCombine);


    const isCardOpponentSuitable = diffStat <= toleranceRange 
      &&  (isSpecificCondition || statsOpponentCombine <= maxStatsPoint);

    if (isCardOpponentSuitable) {
      cardsSelected.push(card);
    }

    if (cardsSelected.length === CARD_OPPONENT_LENGTH) {
      break;
    }
  }


  return cardsSelected;
};


export const createIDGameMiddleware =  (seedEventId: string, cardsPlaySelected: CardInfo[]): string => {
  const defId_cards = cardsPlaySelected.map(card => {
    if (!card.defId) {
      throw new Error('Card must have defId');
    }
    
    return card.defId;
  }).sort();
  const idGame = mythicalCardGameService.createGameId(seedEventId, defId_cards);

  console.log('LOG: ', idGame + Date.now().toString(), ' ID GAME');

  return idGame;
};

export const getOpponentCardMiddleware =  (cardsStore: CardInfo[],  cardsPlaySelected: CardInfo[], opponentTeam?: string): CardInfo[] => {

  const cardsPlayerRecord = cardsPlaySelected.reduce<Record<string, CardInfo>>((record, card) => {
    if (!card.defId) {
      throw new Error('Card must have defId');
    }
    
    record[card.defId] = card;
    return record;
  }, {});

  const cardOpponent  = [...cardsStore.filter(
    card => !cardsPlayerRecord[card.defId || ''] &&(!opponentTeam || card.team === opponentTeam))
  ];

  console.log('LOG: Card Opponent created successfully', cardOpponent.splice(0, 4));

  return cardOpponent;
};

export const createRoundsOfGameMiddleware =  ( cardsPlayer: CardInfo[], cardOpponents: CardInfo[], eventGame: EventInfo, isSpecificCondition?: boolean): RoundInfo[] => {
  const { stats: statsOfEvent, baseDifficulty, round: roundEvent } = eventGame;
  const cardOpponentRandomInEachRound: string[] = [];
  const rounds: RoundInfo[] = [];
  console.log('LOG: Creat stat of each round,  Rounds');

  if (statsOfEvent.length === 0) {
    throw new Error('Stats of event is empty');
  }

  for(let round = 1; round <= roundEvent; round++){
    const randomStats: CardStat[] = [];
    if (round <= 2) {
      randomStats.push(statsOfEvent[Math.floor(Math.random() * statsOfEvent.length)]);
    } else {
      while (randomStats.length < 2) {
        const randomStat = statsOfEvent[Math.floor(Math.random() * statsOfEvent.length)];
        if (!randomStats.includes(randomStat)) {
          randomStats.push(randomStat);
        }
      }
    }

    const remainingStats = statsOfEvent.filter(stat => !randomStats.includes(stat));
    const remainingStatsToShow: CardStat[] = [];
    while (remainingStatsToShow.length < randomStats.length) {
      const randomStat = remainingStats[Math.floor(Math.random() * remainingStats.length)];
      if (!remainingStatsToShow.includes(randomStat)) {
        remainingStatsToShow.push(randomStat);
      }
    }

    const difficulty = baseDifficulty + (roundEvent - round) * 0.5;
    const rangeStat = rangeStatGamePlay(randomStats, cardsPlayer);
    const idealStat = calculateIdealStat(randomStats, difficulty, rangeStat);
    const maxStatPoint = cardsPlayer.reduce((maxStat, card )=> {
      const combineStat = randomStats.reduce((sumStat, stat) => sumStat + (card[stat] as number), 0);
      return Math.max(maxStat, combineStat);
    }, 0);
    let cardOpponent: CardInfo | undefined = undefined;
    let cardPlayerCanBeat: CardInfo | undefined = undefined;
    let toleranceRange = INITIAL_TOLERANCE_RANGE;
    while (!cardPlayerCanBeat) {
      cardOpponent = selectCardOpponentForEachRound(
        cardOpponents,
        randomStats,
        idealStat,
        maxStatPoint,
        cardOpponentRandomInEachRound,
        toleranceRange,
        isSpecificCondition
      );
      cardPlayerCanBeat = selectCardPlayerCanBeat(cardsPlayer, cardOpponent, randomStats);

      if (cardPlayerCanBeat) {
        cardOpponentRandomInEachRound.push(cardOpponent.defId || '');
        cardsPlayer.splice(cardsPlayer.indexOf(cardPlayerCanBeat), 1);
      }
      ++toleranceRange;
    }

    rounds.push({
      id: round,
      stats: randomStats,
      state: 'idle',
      difficulty,
      idealStat,
      score: 0,
      remainingStats: remainingStatsToShow,
      cardOpponent,
      cardPlayerCanBeat,
    });
  }

  console.log('LOG: Add successful', rounds ,' _ Rounds');

  return  rounds;

};

export const calculateIdealStat = (stats: CardStat[], difficulty: number, rangeStat: Record<string, number[]>): Record<string, number> => {

  return stats.reduce<Record<string, number>>((record, stat) => {
    const [maxStat, minStat] = rangeStat[stat];
    record[stat] = minStat + (maxStat - minStat) * (difficulty / 10);
    return record;
  }, {});
};

const selectCardOpponentForEachRound = (cardOpponents: CardInfo[], stats: CardStat[], idealStat: Record<string, number>, maxStatPoint: number, cardOpponentSelectedInEachRound: string[], _toleranceRange: number,  isSpecificCondition ?: boolean) => {
  const cardOpponentSelected: CardInfo[] = [];
  let toleranceRange = _toleranceRange;

  while (cardOpponentSelected.length < CARD_OPPONENT_LENGTH) {
    getOpponentCardRandomList(
      cardOpponents,
      stats,
      idealStat,
      toleranceRange,
      cardOpponentSelected,
      maxStatPoint,
      cardOpponentSelectedInEachRound,
      isSpecificCondition);
    toleranceRange += 1;
  }


  return cardOpponentSelected[Math.floor(Math.random() * CARD_OPPONENT_LENGTH)];
};


const selectCardPlayerCanBeat =  (
  cardsPlayGameSelected: CardInfo[],
  cardOpponent: CardInfo,
  stats: CardStat[],
): CardInfo| undefined => {
  const combineOpponentStat = stats.reduce((sumStat, stat) => sumStat + (cardOpponent[stat] as number) , 0);
  const cardPlayerCanBeats = cardsPlayGameSelected.filter((card) => {
    const combinePlayerStat = stats.reduce((sumStat, stat) => sumStat + (card[stat] as number), 0);

    return combinePlayerStat >= combineOpponentStat;
  });

  if (cardPlayerCanBeats.length !== 0) {
    return cardPlayerCanBeats[Math.floor(Math.random() * cardPlayerCanBeats.length)];
  }

  return undefined;

};
