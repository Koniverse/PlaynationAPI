import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import Account from '@src/models/Account';
import Game from '@src/models/Game';

export interface TossUpInfo {
  stats: string[]; // Assuming STATS_LIST contains strings
  opponentTeams: string[]; // Assuming TEAM_LIST contains strings
  round: number;
  difficulty: number;
  playDuration: number;
  gameplayPerEvent: number;
}

interface Bonus {
  bonus: number;
  bonus_text: string;
}

interface TeamBonus extends Bonus {
  team: string; // Assuming TEAM_LIST contains strings
}

interface PositionBonus extends Bonus {
  position: string; // Assuming POSITION_LIST contains strings
}

interface ProgramBonus extends Bonus {
  program: string; // Assuming PROGRAM_LIST contains strings
}

export class GameEvent extends Model<InferAttributes<GameEvent>, InferCreationAttributes<GameEvent>> {
  declare id: CreationOptional<number>; // id on db
  declare documentId: number;
  declare active: boolean;
  declare name: string;
  declare gameId: Game;
  declare icon: string;
  declare description: string;
  declare startTime: Date;
  declare endTime: Date;
  declare tossUpInfo: TossUpInfo;
  declare tossUpBonus: [TeamBonus | PositionBonus | ProgramBonus];
}

GameEvent.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  documentId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gameId: {
    type: DataTypes.INTEGER,
    references: {
      model: Game,
      key: 'id',
    },
  },
  icon: {
    type: DataTypes.JSON, // Assuming media type is stored as JSON
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  tossUpInfo: {
    type: DataTypes.JSONB, // Assuming component type is stored as JSON
    allowNull: true,
  },
  tossUpBonus: {
    type: DataTypes.JSONB, // Assuming dynamiczone type is stored as JSON
    allowNull: true,
  },
}, {
  indexes: [{unique: false, fields: ['gameId']}],
  tableName: 'game_event',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default GameEvent;
