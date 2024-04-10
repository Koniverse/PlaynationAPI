import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';

export class GameItem extends Model<InferAttributes<GameItem>, InferCreationAttributes<GameItem>> {
  declare id: CreationOptional<number>; // id on db
  declare gameId: number;
  declare name: string;
  declare description: string;
  declare price: number;
  declare tokenPrice: number;
  declare maxBuy: number;
}

GameItem.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  gameId: {
    type: DataTypes.INTEGER,
  },
  name: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.STRING,
  },
  price: {
    type: DataTypes.INTEGER,
  },
  tokenPrice: {
    type: DataTypes.INTEGER,
  },
  maxBuy: {
    type: DataTypes.INTEGER,
  },
}, {
  indexes: [{unique: true, fields: ['gameId']}],
  tableName: 'game_item',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default GameItem;
