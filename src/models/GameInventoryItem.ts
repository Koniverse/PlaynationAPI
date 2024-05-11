import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import Game from '@src/models/Game';
import Account from '@src/models/Account';
import GameData from '@src/models/GameData';
import GameItem from '@src/models/GameItem';

export enum GameInventoryItemStatus {
  INACTIVE = 'inactive', // After buy item request
  ACTIVE = 'active', // After validate signature
  USED = 'used', // After used item
}

export class GameInventoryItem extends Model<
  InferAttributes<GameInventoryItem>,
  InferCreationAttributes<GameInventoryItem>
> {
  declare id: CreationOptional<number>; // id on db
  declare gameId: number;
  declare accountId: number;
  declare gameDataId: number;
  declare gameItemId: number;
  declare transactionId: string; // random UUID
  declare buyTime: Date;
  declare endEffectTime: CreationOptional<Date>;
  declare status: GameInventoryItemStatus;
  declare quantity: number;

  // After validated signature
  declare signature: CreationOptional<string>;

  // After used item
  declare usedTime: CreationOptional<Date>;
}

GameInventoryItem.init(
  {
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
    gameItemId: {
      type: DataTypes.INTEGER,
      references: {
        model: GameItem,
        key: 'id',
      },
    },
    transactionId: {
      type: DataTypes.STRING,
    },
    signature: {
      type: DataTypes.STRING,
    },
    buyTime: {
      type: DataTypes.DATE,
    },
    endEffectTime: {
      type: DataTypes.DATE,
    },
    usedTime: {
      type: DataTypes.DATE,
    },
    status: {
      type: DataTypes.ENUM(
        GameInventoryItemStatus.INACTIVE,
        GameInventoryItemStatus.ACTIVE,
        GameInventoryItemStatus.USED,
      ),
    },
    quantity: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: 'game_inventory_item',
    sequelize: SequelizeServiceImpl.sequelize,
    createdAt: true,
    updatedAt: true,
  },
);

export default GameInventoryItem;
