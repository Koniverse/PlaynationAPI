import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import Game from '@src/models/Game';

export class GameItem extends Model<InferAttributes<GameItem>, InferCreationAttributes<GameItem>> {
  declare id: CreationOptional<number>; // id on db
  declare gameId: number;
  declare contentId: number;
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
  contentId: {
    type: DataTypes.INTEGER,
  },
  gameId: {
    type: DataTypes.INTEGER,
    references: {
      model: Game,
      key: 'id',
    },
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
