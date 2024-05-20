import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';

export class GameInventoryLog extends Model<
  InferAttributes<GameInventoryLog>,
  InferCreationAttributes<GameInventoryLog>
> {
  declare id: CreationOptional<number>;
  declare gameId: number;
  declare accountId: number;
  declare gameDataId: number;
  declare gameItemId: number;
  declare quantity: number;
  declare note: string;
}

GameInventoryLog.init(
  {
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
    quantity: {
      type: DataTypes.INTEGER,
    },
    note: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: 'game_inventory_item_logs',
    sequelize: SequelizeServiceImpl.sequelize,
    createdAt: true,
    updatedAt: true,
  },
);

export default GameInventoryLog;
