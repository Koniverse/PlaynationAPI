import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import Game from '@src/models/Game';
import Account from '@src/models/Account';
import GameData from '@src/models/GameData';

export class GamePlay extends Model<InferAttributes<GamePlay>, InferCreationAttributes<GamePlay>> {
  declare id: CreationOptional<number>; // id on db
  declare gameId: number;
  declare accountId: number;
  declare gameDataId: number;
  declare token: string;
  declare startTime: Date;
  declare energy: number;
  declare endTime: CreationOptional<Date>;
  declare point: CreationOptional<number>;
  declare gamePoint: CreationOptional<number>;
  declare ratio: CreationOptional<number>;
  declare success: CreationOptional<boolean>;
  declare state: CreationOptional<any>;
  declare stateData: CreationOptional<any>;
  declare stateTimestamp: CreationOptional<string>;
  declare stateSignature: CreationOptional<string>;
  declare stateCount: CreationOptional<number>;
}

GamePlay.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  gameId: {
    type: DataTypes.INTEGER,
    references: {
      model: Game,
      key: 'id',
    },
  },
  accountId: {
    type: DataTypes.INTEGER,
    references: {
      model: Account,
      key: 'id',
    },
  },
  gameDataId: {
    type: DataTypes.INTEGER,
    references: {
      model: GameData,
      key: 'id',
    },
  },
  token: {
    type: DataTypes.STRING,
  },
  startTime: {
    type: DataTypes.DATE,
  },
  endTime: {
    type: DataTypes.DATE,
  },
  energy: {
    type: DataTypes.INTEGER,
  },
  point: {
    type: DataTypes.INTEGER,
  },
  gamePoint: {
    type: DataTypes.INTEGER,
  },
  ratio: {
    type: DataTypes.FLOAT,
    defaultValue: 1,
  },
  success: {
    type: DataTypes.BOOLEAN,
  },
  stateCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  state: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  stateData: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  stateSignature: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  stateTimestamp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  indexes: [],
  tableName: 'game_play',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default GamePlay;
