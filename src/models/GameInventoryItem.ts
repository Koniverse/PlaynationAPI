import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';

export enum GameInventoryItemStatus {
  READY = 'ready',
  ACTIVE = 'inactive',
  USED = 'used',
}

export class GameInventoryItem extends Model<InferAttributes<GameInventoryItem>, InferCreationAttributes<GameInventoryItem>> {
  declare id: CreationOptional<number>; // id on db
  declare gameId: number;
  declare accountId: number;
  declare gameDataId: number;
  declare gameItemId: number;
  declare buyTime: Date;
  declare useTime: CreationOptional<Date>;
  declare endEffectTime: CreationOptional<Date>;
  declare status: GameInventoryItemStatus;
}

GameInventoryItem.init({
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
  gameItemId: {
    type: DataTypes.INTEGER,
  },
  buyTime: {
    type: DataTypes.DATE,
  },
  useTime: {
    type: DataTypes.DATE,
  },
  endEffectTime: {
    type: DataTypes.DATE,
  },
  status: {
    type: DataTypes.ENUM(GameInventoryItemStatus.READY, GameInventoryItemStatus.ACTIVE, GameInventoryItemStatus.USED),
  },
}, {
  indexes: [{unique: true, fields: ['gameDataId']}, {unique: true, fields: ['gameId', 'accountId']}],
  tableName: 'game_inventory_item',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default GameInventoryItem;
