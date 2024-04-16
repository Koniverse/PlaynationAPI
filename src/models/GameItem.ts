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
  declare itemGroup: CreationOptional<number>;
  declare itemGroupLevel: CreationOptional<number>;
  declare slug: string; // With levelItems like LEVEL1, LEVEL2, LEVEL3, LEVEL4, LEVEL5 slug will be itemGroup + levelNumber
  declare tokenPrice: number;
  declare maxBuy: number;
  declare effectDuration: CreationOptional<number>;
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
  slug: {
    type: DataTypes.STRING,
  },
  itemGroup: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  itemGroupLevel: {
    type: DataTypes.INTEGER,
    allowNull: true,
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
  effectDuration: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  indexes: [{unique: false, fields: ['gameId']}],
  tableName: 'game_item',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default GameItem;
