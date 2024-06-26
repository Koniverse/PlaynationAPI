import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import Account from '@src/models/Account';
import Game from '@src/models/Game';

export class GameData extends Model<InferAttributes<GameData>, InferCreationAttributes<GameData>> {
  declare id: CreationOptional<number>; // id on db
  declare accountId: number;
  declare gameId: number;
  declare level: number;
  declare point: number;
  declare rank: number;
  declare dayLimit: number;
}

GameData.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  accountId: {
    type: DataTypes.INTEGER,
    references: {
      model: Account,
      key: 'id',
    },
  },
  gameId: {
    type: DataTypes.INTEGER,
    references: {
      model: Game,
      key: 'id',
    },
  },
  level: {
    type: DataTypes.INTEGER,
  },
  point: {
    type: DataTypes.INTEGER,
  },
  rank: {
    type: DataTypes.INTEGER,
  },
  dayLimit: {
    type: DataTypes.INTEGER,
  },
}, {
  indexes: [{unique: true, fields: ['gameId', 'accountId']}],
  tableName: 'game_data',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default GameData;
