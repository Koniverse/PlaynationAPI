import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import GamePlay from '@src/models/GamePlay';

export class GamePlayStateLog extends Model<InferAttributes<GamePlayStateLog>, InferCreationAttributes<GamePlayStateLog>> {
  declare id: CreationOptional<number>; // id on db
  declare gamePlayId: number;
  declare state: any;
  declare stateData: any;
  declare stateTimestamp: string;
  declare stateSignature: string;
  declare stateNumber: number;
  declare secretData: CreationOptional<any>;
  declare validData: boolean;
}

GamePlayStateLog.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  gamePlayId: {
    type: DataTypes.INTEGER,
    references: {
      model: GamePlay,
      key: 'id',
    },
  },
  stateNumber: {
    type: DataTypes.INTEGER,
  },
  state: {
    type: DataTypes.JSONB,
  },
  stateData: {
    type: DataTypes.JSONB,
  },
  stateSignature: {
    type: DataTypes.STRING,
  },
  stateTimestamp: {
    type: DataTypes.STRING,
  },
  secretData: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  validData: {
    type: DataTypes.BOOLEAN,
  },
}, {
  indexes: [{unique: false, fields: ['gamePlayId']}],
  tableName: 'game_play_state_log',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default GamePlayStateLog;
