import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';

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
  declare success: CreationOptional<boolean>;
}

GamePlay.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  gameId: {
    type: DataTypes.INTEGER,
  },
  accountId: {
    type: DataTypes.INTEGER,
  },
  gameDataId: {
    type: DataTypes.INTEGER,
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
  success: {
    type: DataTypes.BOOLEAN,
  },
}, {
  indexes: [{unique: true, fields: ['gameDataId']}, {unique: true, fields: ['gameId', 'accountId']}],
  tableName: 'game_play',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default GamePlay;
