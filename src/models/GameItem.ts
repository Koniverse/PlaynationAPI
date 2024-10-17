import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import Game from '@src/models/Game';

export const ITEM_GROUP_LEVEL = 'LEVEL';
export const NO_GROUP_KEY = 'NO_GROUP';

export class GameItem extends Model<InferAttributes<GameItem>, InferCreationAttributes<GameItem>> {
  declare id: CreationOptional<number>; // id on db
  declare contentId: number;
  declare gameId: CreationOptional<number>;
  declare slug: string; // Item slug like LEVEL1, LEVEL2, LEVEL3, LEVEL4, LEVEL5
  declare name: string;
  declare description: string;

  declare price: number; // NFS point
  declare tokenPrice: CreationOptional<number>;
  declare maxBuy: CreationOptional<number>;
  declare maxBuyDaily: CreationOptional<number>;

  declare itemGroup: CreationOptional<string>; // special item group is "LEVEL" is very is game level
  declare itemGroupLevel: CreationOptional<number>;

  declare effectDuration: CreationOptional<number>; // -1 is forever, 0 is one time use, > 0 is duration in seconds
  declare documentId: CreationOptional<string>;
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
    allowNull: true,
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
    allowNull: true,
  },
  maxBuy: {
    type: DataTypes.INTEGER,
  },
  maxBuyDaily: {
    type: DataTypes.INTEGER,
  },
  effectDuration: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  documentId: {
    type: DataTypes.STRING,
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
