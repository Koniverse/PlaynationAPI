import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import {Game, GameEvent, TossUpBonus, TossUpInfo} from '@src/models';
import {AccountService} from '@src/services/AccountService';
import {QuickGetService} from '@src/services/QuickGetService';

const accountService = AccountService.instance;
const quickGetService = QuickGetService.instance;


export interface GameEventContentCMS {
  id: number;
  documentId: string;
  name: string;
  game: {
    documentId: string;
  },
  icon: string;
  description: string;
  start_time: Date;
  end_time: Date;
  toss_up_info: {
    stats: string[];
    opponent_teams: string[];
    round: number;
    difficulty: number;
    play_duration: number;
    gameplay_per_event: number;
  };
  toss_up_bonus: ({
    __component: string;
    team: string;
    program: string;
    position: string;
    bonus: number;
    bonus_text: string;
  })[];
}

export class GameEventService {
  private gameMap: Record<string, Game> | undefined;

  constructor(private sequelizeService: SequelizeService) {
  }

  cmsParseTossUpInfo({stats, opponent_teams, gameplay_per_event, difficulty, play_duration, round}: GameEventContentCMS['toss_up_info']): TossUpInfo {
    return {
      stats,
      opponentTeams: opponent_teams,
      gameplayPerEvent: gameplay_per_event,
      difficulty,
      playDuration: play_duration,
      round,
    };
  }

  cmsParseTossUpBonus(data: GameEventContentCMS['toss_up_bonus']): TossUpBonus[] {
    return data.map((item) => {
      const bonusAmount = {
        bonus: item.bonus,
        bonusText: item.bonus_text,
      };

      if (item.__component === 'mythical.team-bonus') {
        return {
          ...bonusAmount,
          team: item.team,
        };
      } else if (item.__component === 'mythical.position-bonus') {
        return {
          ...bonusAmount,
          position: item.position,
        };
      } else if (item.__component === 'mythical.program-bonus') {
        return {
          ...bonusAmount,
          program: item.program,
        };
      } else {
        throw new Error(`Unknown toss up bonus type: ${item.__component}`);
      }
    });
  }

  async sync(data: GameEventContentCMS[]) {
    const response = {
      success: true,
    };

    const gameEvents = await quickGetService.listGameEvent();
    const existedMap = gameEvents.reduce((acc, ge) => {
      acc[ge.documentId] = {
        ge,
        active: false,
      };

      return acc;
    }, {} as Record<string, { ge: GameEvent, active: boolean }>);

    const games = await quickGetService.listGame();
    const gameMap = games.reduce((acc, game) => {
      acc[game.documentId] = game;
      return acc;
    }, {} as Record<string, Game>);
    for (const entry of data) {
      const existed = existedMap[entry.documentId]?.ge;
      const game = gameMap[entry.game.documentId];
      if (!game) {
        throw new Error(`Game not found: ${entry.game.documentId}`);
      }

      const upsertData = {
        documentId: entry.documentId,
        name: entry.name,
        gameId: game.id as number,
        icon: entry.icon,
        description: entry.description,
        startTime: entry.start_time,
        endTime: entry.end_time,
        tossUpInfo: this.cmsParseTossUpInfo(entry.toss_up_info),
        tossUpBonus: this.cmsParseTossUpBonus(entry.toss_up_bonus),
        active: true,
      };

      if (!existed) {
        await GameEvent.create(upsertData);
      } else {
        existedMap[entry.documentId].active = true;
        await existed.update(upsertData);
      }
    }

    // Deactivate non-existed
    for (const {ge, active} of Object.values(existedMap)) {
      if (!active) {
        await ge.update({
          active: false,
        });
      }
    }

    return response;
  }

  async list() {
    return (await quickGetService.listGameEvent()).filter((ge) => ge.active);
  }

  async find(id: number) {
    return await quickGetService.findGameEvent(id);
  }

  // Singleton
  private static _instance: GameEventService;
  public static get instance() {
    if (!GameEventService._instance) {
      GameEventService._instance = new GameEventService(SequelizeServiceImpl);
    }
    return GameEventService._instance;
  }
}
