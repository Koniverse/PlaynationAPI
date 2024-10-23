import {GameState} from '@playnation/game-sdk';
import {GamePlay} from '@src/models';
import {GameAdapter} from '@src/services/game/GameAdapter';
import {SubmitGamePlayParams} from '../GameService';
import {CreationAttributes} from 'sequelize/types/model';
import {CardInfo} from '@koniverse/telegram-bot-grpc';
import {QuickGetService} from '@src/services/QuickGetService';
import {GameEventService} from '@src/services/game/GameEventService';
import {NflRivalCardService} from '@src/services/game/mythicalGame/NflRivalCardService';


interface StatePayload {
  action: 'start' | 'play' | 'finish';
  roundData: any
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
  rounds: RoundInfo[];
  currentRound: number;
  state: MythicalGameState;
  playDuration: number;
}

const gameEventService = GameEventService.instance;
const cardService = NflRivalCardService.instance;
const quickGetService = QuickGetService.instance;

export class MythicalGameCardAdapter extends GameAdapter {
  async onNewGamePlay(data: CreationAttributes<GamePlay>): Promise<CreationAttributes<GamePlay>> {
    const gameEvent = await quickGetService.requireGameEvent(data.gameEventId as number);
    // Todo:  Issue-22 | Thiendekaco | Parse the initState
    // Todo:  Issue-22 | Thiendekaco | Validate user cards
    const userCards = await cardService.getUserCard(data.accountId);
    // Todo:  Issue-22 | Thiendekaco | Generate opponent team
    // Todo:  Issue-22 | Thiendekaco | Return into the state
    // Todo:  Issue-22 | Thiendekaco | Save stat selection into data.stateData
    // MythicalGameState.NOT_STARTED;
    // currentRound = 0;
    // Todo:  Issue-22 | Thiendekaco | Private the stat(s) selection


    return Promise.resolve(data);
  }
  async onSubmitGameplay(data: SubmitGamePlayParams): Promise<void> {
    return Promise.resolve();
    // Do nothing
  }

  async onSubmitState(gamePlay:GamePlay, data: unknown): Promise<unknown> {
    return Promise.resolve();

    const payload = data as StatePayload;

    // Todo:  Issue-22 | Thiendekaco | Parse the data from user

    // Phrase 1: Start the game
    // data: {step: 'start'}
    // MythicalGameState.START;
    // playDuration = 0;

    // Phrase 2: Run the game - submit round
    // data: {step: 'start'}
    // Todo:  Issue-22 | Thiendekaco | Validate the state by the round
    // Todo:  Issue-22 | Thiendekaco | Compute the next round
    // Todo:  Issue-22 | Thiendekaco | -- Check secret stat
    // Todo:  Issue-22 | Thiendekaco | -- Compute the point + bonus, save play duration
    // MythicalGameState.PLAYING;
    // currentRound = currentRound + 1;

    // Todo:  Issue-22 | Thiendekaco | Phrase 3: Finish the game
    // data: {step: 'finish'}
    // Todo:  Issue-22 | Thiendekaco | -- Compute the final point + bonus point by play duration
    // MythicalGameState.FINISHED;

    // Todo:  Issue-22 | Thiendekaco | return computed state
  }

  // Todo:  Issue-22 | Thiendekaco | Create cron auto finish game - May be later
}