import GamePlay from '@src/models/GamePlay';
import {CreationAttributes} from 'sequelize/types/model';
import {SubmitGamePlayParams} from '@src/services/game/GameService';

export abstract class GameAdapter {
  abstract onNewGamePlay(data: CreationAttributes<GamePlay>): Promise<CreationAttributes<GamePlay>>;
  abstract onSubmitGameplay(data: SubmitGamePlayParams): Promise<void>;
  abstract onSubmitState(gamePlay: GamePlay, state: unknown): Promise<unknown>;
}