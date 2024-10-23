import GamePlay from '@src/models/GamePlay';
import {CreationAttributes} from 'sequelize/types/model';
import {SubmitGamePlayParams} from '@src/services/game/GameService';
import {GameState} from '@playnation/game-sdk';

export abstract class GameAdapter {
  abstract onNewGamePlay(data: CreationAttributes<GamePlay>): Promise<void>;
  abstract onSubmitGameplay(data: SubmitGamePlayParams): Promise<void>;
  abstract onSubmitState(state: GameState<unknown>): Promise<void>;
}