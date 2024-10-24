import { GamePlay, TossUpInfo } from '@src/models';
import { GameAdapter } from '@src/services/game/GameAdapter';
import { SubmitGamePlayParams } from '../GameService';
import { CreationAttributes } from 'sequelize/types/model';
import { CardInfo, CardInfo__Output } from '@koniverse/telegram-bot-grpc';
import { QuickGetService } from '@src/services/QuickGetService';
import { GameEventService } from '@src/services/game/GameEventService';
import { NflRivalCardService } from '@src/services/game/mythicalGame/NflRivalCardService';
import { createPromise, isSameObject, shuffleArray, tryToParseJSON, tryToStringify } from '@src/utils';
import gamePlay from '@src/models/GamePlay';


interface StateData {
  action: 'start' | 'play' | 'finish';
  roundData?: {
    cardPlayer: CardInfo
  }
}

export enum MythicalGameState {
  NOT_STARTED = 'not_started',
  START = 'start',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

export enum CardStat {
  STR = 'strength',
  ACC = 'acceleration',
  JMP = 'jump',
  POW = 'power',
  PRE = 'presence',
  END = 'endurance',
  QUI = 'quickness',
  CAR = 'carry'
}

export type ProcessState = 'finished' | 'active' | 'idle' | 'ready';


export interface RoundSecret {
  stats: CardStat[],
  cardPlayerCanBeat?: CardInfo,
}

export interface RoundInfo {
  roundNumber: number,
  stats: CardStat[][],
  state: ProcessState,
  difficulty: number,
  idealStat: Record<string, number>,
  timeEnd?: string,
  cardOpponent?: CardInfo,
  isWin?: boolean,
  score: number,
  cardPlayer?: CardInfo,
}

export interface MythicalCardGameData {
  userCards: CardInfo[];
  cardOpponents: CardInfo[];
  rounds: RoundInfo[];
  currentRound: number;
  state: MythicalGameState;
  playDuration: number;
}

export interface MythicalCardGameDataInit {
  userCardsSelected: CardInfo[];
}

const gameEventService = GameEventService.instance;
const cardService = NflRivalCardService.instance;
const quickGetService = QuickGetService.instance;


const CARD_OPPONENT_LENGTH = 5;
const INITIAL_TOLERANCE_RANGE = 5;

export class MythicalGameCardAdapter extends GameAdapter {
  async onNewGamePlay(data: CreationAttributes<GamePlay>): Promise<CreationAttributes<GamePlay>> {
    const { gameEventId, accountId } = data;
    const { userCardsSelected } = data.initState as MythicalCardGameDataInit;
    const { tossUpInfo, tossUpBonus, endTime, startTime} = await quickGetService.requireGameEvent(gameEventId as number);

    if (endTime.getTime() < Date.now()) {
      throw new Error('Game event is expired');
    }

    if (startTime.getTime() > Date.now()) {
      throw new Error('Game event is not started');
    }

    if(tossUpInfo.stats.length === 0) {
      throw new Error('Stats of event is empty');
    }

    const statSet = new Set(tossUpInfo.stats);

    if(statSet.size !== 4){
      throw new Error('Stats of event must have 4 unique stats');
    }

    const gameOfEventStored = await quickGetService.findAllGameByGameEventId(gameEventId as number);
    await cardService.cardMapReady.promise;

    if (!userCardsSelected || userCardsSelected.length !== tossUpInfo.round + 1) {
      throw new Error('Invalid card selected');
    }

    if(gameOfEventStored.length + 1 > tossUpInfo.gameplayPerEvent) {
      throw new Error('Game event is full');
    }

    await this.validateCardUser(userCardsSelected, accountId, undefined, tossUpInfo.round);
    const cardStore = Object.values(await cardService.getCardMap());
    const cardOpponents = this.getOpponentCardMiddleware(cardStore, userCardsSelected, tossUpInfo.opponentTeams);
    const { rounds, secret} = this.createRoundsOfGameMiddleware(cardStore, cardOpponents, tossUpInfo);

    const gameData: MythicalCardGameData = {
      cardOpponents,
      rounds,
      userCards: userCardsSelected,
      currentRound: 0,
      playDuration: 0,
      state: MythicalGameState.NOT_STARTED };


    return Promise.resolve({
      ...data,
      secretData: secret,
      state: tryToStringify(gameData),
      stateData: gameData });
  }


  async onSubmitGameplay(data: SubmitGamePlayParams): Promise<void> {
    return Promise.resolve();
    // Do nothing
  }

  async onSubmitState(gamePlay:GamePlay, data: StateData): Promise<MythicalCardGameData> {
    const gamePlayData: MythicalCardGameData  = tryToParseJSON<MythicalCardGameData>(gamePlay.state);
    const secretData = gamePlay.secretData as RoundSecret[];
    const { tossUpBonus } = await quickGetService.requireGameEvent(gamePlay.gameEventId);
    let currentRound = gamePlayData.currentRound;
    const { rounds } = gamePlayData;

    if (data.action === 'start') {
      if (gamePlayData.state !== MythicalGameState.NOT_STARTED && currentRound === 0) {
        throw new Error('Game already started');
      }

      gamePlayData.state = MythicalGameState.START;
      gamePlayData.rounds[0].state = 'ready';
    } else if (data.action === 'play') {
      if(!(gamePlayData.state === MythicalGameState.START || gamePlayData.state === MythicalGameState.PLAYING)) {
        throw new Error('Game not started');
      }

      gamePlayData.state = MythicalGameState.PLAYING;
      ++currentRound;

      if (currentRound > rounds.length) {
        throw new Error('Game already finished');
      }

      if (!data.roundData?.cardPlayer){
        throw new Error('Card player is required');
      }

      let round: RoundInfo = {...rounds[currentRound - 1]};

      if (round.state !== 'ready') {
        throw new Error('Round not ready');
      }

      await this.validateCardUser([data.roundData.cardPlayer], gamePlay.accountId, gamePlayData.userCards);
      round.cardPlayer = data.roundData.cardPlayer;
      round.state = 'active';
      round = await this.compareCardPlayerWithOpponentMiddleware(round, secretData[currentRound - 1]);

      if(round.isWin && tossUpBonus.length > 0) {
        let bonusPoint = 0;
        tossUpBonus.forEach((b) => {
          let isBonusRound = false;
          if('team' in b){
            isBonusRound = b.team === round.cardPlayer?.team;
          } else if ('position' in b) {
            isBonusRound = round.cardPlayer?.position === b.position ;
          } else if ('program' in b) {
            isBonusRound = round.cardPlayer?.program === b.program;
          }

          if (isBonusRound) {
            bonusPoint += b.bonus / 100 * round.score;
          }
        });
        round.score += bonusPoint;
      }

      if (round.state === 'active') {
        round.state = 'finished';
        rounds[currentRound - 1] = round;
        gamePlayData.userCards = gamePlayData.userCards.filter((card) => card.defId !== round.cardPlayer?.defId);

        if (currentRound < rounds.length) {
          rounds[currentRound].state = 'ready';
        }
      }

    } else if (data.action === 'finish') {
      if (currentRound !== rounds.length) {
        throw new Error('Game not finished');
      }

      gamePlayData.state = MythicalGameState.FINISHED;
      gamePlayData.playDuration = gamePlay.endTime.getTime() - gamePlay.startTime.getTime();
      gamePlay.point = rounds.reduce((sum, round) => sum + round.score, 0) + gamePlayData.playDuration;
    } else {
      throw new Error('Invalid action');
    }



    return {
      ...gamePlayData,
      currentRound,
      rounds };

  }



  private async validateCardUser (
    cardSelected: CardInfo[],
    accountId: number,
    cardsUser?: CardInfo[],
    round?: number): Promise<boolean> {
    await cardService.cardMapReady.promise;
    const { cards: userCards} = await cardService.getUserCard(accountId);

    const isValid =
      cardSelected.every(card => (cardsUser || userCards).find((card_) => isSameObject<CardInfo>(card_, card)))
      && (!round || cardSelected.length === round + 1);

    if(!isValid) {
      throw new Error('Invalid card selected');
    }

    return isValid;
  }

  private rangeStatGamePlay (stats: CardStat[], card: CardInfo[]): Record<string, number[]>  {
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
  }

  private getOpponentCardRandomList (
    cardOpponent: CardInfo[], stats: CardStat[],
    idealStat: Record<string, number>,
    toleranceRange: number,
    cardsSelected: CardInfo[],
    maxStatsPoint: number,
    cardOpponentSelectedInEachRound: string[],
    isSpecificCondition?: boolean): CardInfo[] {

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
  }
  

  private getOpponentCardMiddleware (
    cardsStore: CardInfo[],
    cardsPlaySelected: CardInfo[],
    opponentTeam?: string[]): CardInfo[] {

    const cardsPlayerRecord = cardsPlaySelected.reduce<Record<string, CardInfo>>((record, card) => {
      if (!card.defId) {
        throw new Error('Card must have defId');
      }

      record[card.defId] = card;
      return record;
    }, {});

    return [...cardsStore.filter(
      card => !cardsPlayerRecord[card.defId || '']
        && ((!opponentTeam || opponentTeam.length === 0 )|| opponentTeam.includes(card.team || '')))];
  }

  private createRoundsOfGameMiddleware (
    cardsPlayer: CardInfo[],
    cardOpponents: CardInfo[],
    tossUpInfo: TossUpInfo): {rounds: RoundInfo[], secret: RoundSecret[]} {
    const { stats: statsOfEvent, difficulty, round: roundEvent, opponentTeams } = tossUpInfo;
    const isSpecificCondition = opponentTeams && opponentTeams.length > 0;
    const cardOpponentRandomInEachRound: string[] = [];
    const rounds: RoundInfo[] = [];
    const roundsSecret: RoundSecret[] = [];
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


      const difficultyOfRound = difficulty + (roundEvent - round) * 0.5;
      const rangeStat = this.rangeStatGamePlay(randomStats, cardsPlayer);
      const idealStat = this.calculateIdealStat(randomStats, difficultyOfRound, rangeStat);
      const maxStatPoint = cardsPlayer.reduce((maxStat, card )=> {
        const combineStat = randomStats.reduce((sumStat, stat) => sumStat + (card[stat] as number), 0);
        return Math.max(maxStat, combineStat);
      }, 0);
      let cardOpponent: CardInfo | undefined = undefined;
      let cardPlayerCanBeat: CardInfo | undefined = undefined;
      let toleranceRange = INITIAL_TOLERANCE_RANGE;
      while (!cardPlayerCanBeat) {
        cardOpponent = this.selectCardOpponentForEachRound(
          cardOpponents,
          randomStats,
          idealStat,
          maxStatPoint,
          cardOpponentRandomInEachRound,
          toleranceRange,
          isSpecificCondition);

        cardPlayerCanBeat = this.selectCardPlayerCanBeat(cardsPlayer, cardOpponent, randomStats);

        if (cardPlayerCanBeat) {
          cardOpponentRandomInEachRound.push(cardOpponent.defId || '');
          cardsPlayer.splice(cardsPlayer.indexOf(cardPlayerCanBeat), 1);
        }
        ++toleranceRange;
      }


      roundsSecret.push({stats: randomStats, cardPlayerCanBeat});

      rounds.push({
        roundNumber: round,
        stats: shuffleArray<CardStat[]>([randomStats, remainingStatsToShow]),
        state: 'idle',
        difficulty: difficultyOfRound,
        idealStat,
        score: 0,
        cardOpponent });
    }


    return  {rounds, secret: roundsSecret};
  }

  private calculateIdealStat (
    stats: CardStat[],
    difficulty: number,
    rangeStat: Record<string, number[]>): Record<string, number> {

    return stats.reduce<Record<string, number>>((record, stat) => {
      const [maxStat, minStat] = rangeStat[stat];
      record[stat] = minStat + (maxStat - minStat) * (difficulty / 10);
      return record;
    }, {});
  }

  private selectCardOpponentForEachRound (
    cardOpponents: CardInfo[],
    stats: CardStat[],
    idealStat: Record<string, number>,
    maxStatPoint: number,
    cardOpponentSelectedInEachRound: string[],
    _toleranceRange: number,
    isSpecificCondition ?: boolean) {
    const cardOpponentSelected: CardInfo[] = [];
    let toleranceRange = _toleranceRange;

    while (cardOpponentSelected.length < CARD_OPPONENT_LENGTH) {
      this.getOpponentCardRandomList(
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
  }


  private selectCardPlayerCanBeat  (
    cardsPlayGameSelected: CardInfo[],
    cardOpponent: CardInfo,
    stats: CardStat[],
  ): CardInfo| undefined {
    const combineOpponentStat = stats.reduce((sumStat, stat) => sumStat + (cardOpponent[stat] as number) , 0);
    const cardPlayerCanBeats = cardsPlayGameSelected.filter((card) => {
      const combinePlayerStat = stats.reduce((sumStat, stat) => sumStat + (card[stat] as number), 0);

      return combinePlayerStat >= combineOpponentStat;
    });

    if (cardPlayerCanBeats.length !== 0) {
      return cardPlayerCanBeats[Math.floor(Math.random() * cardPlayerCanBeats.length)];
    }

    return undefined;

  }


  private async compareCardPlayerWithOpponentMiddleware (round: RoundInfo, { stats }: RoundSecret): Promise<RoundInfo> {
    const { promise, resolve } = createPromise<RoundInfo>();
    let isWin = false;
    let score = 0;
    if (round.state === 'active' && round.cardPlayer && round.cardOpponent) {
      const cardPlayerStatPoint = stats.reduce(
        (acc, stat) => round.cardPlayer ? acc + (round.cardPlayer[stat] || 0) : acc,
        0);
      const cardOpponentStatPoint = stats.reduce(
        (acc, stat) => round.cardOpponent ? acc + (round.cardOpponent[stat] || 0) : acc,
        0);

      if ( cardPlayerStatPoint >= cardOpponentStatPoint) {
        isWin = true;
        score = cardPlayerStatPoint;
      } else {
        isWin = false;
      }
    }

    resolve({...round, isWin, score});

    return promise;
  }

}