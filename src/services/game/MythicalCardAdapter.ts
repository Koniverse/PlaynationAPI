import {GameState} from '@playnation/game-sdk';
import {GamePlay} from '@src/models';
import {GameAdapter} from '@src/services/game/GameAdapter';
import {SubmitGamePlayParams} from './GameService';
import {CreationAttributes} from 'sequelize/types/model';

export class MythicalCardAdapter extends GameAdapter {
  async onNewGamePlay(data: CreationAttributes<GamePlay>): Promise<void> {
    return Promise.resolve();
    // Todo: Generate opponent team
    // Todo: Return into the payload
  }
  async onSubmitGameplay(data: SubmitGamePlayParams): Promise<void> {
    return Promise.resolve();
    // Do nothing
  }
  async onSubmitState(data: GameState<unknown>): Promise<void> {
    return Promise.resolve();
    // Todo: Parse the state
    // Todo: Validate the state by the round
    // Todo: Run logic
    // Todo: Return the result
    // Todo: Finish round
    // Todo: Finish game
  }
  
}