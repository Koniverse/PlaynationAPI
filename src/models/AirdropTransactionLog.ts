import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';

export enum AirdropTransactionLogStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export class AirdropTransactionLog extends Model<
  InferAttributes<AirdropTransactionLog>,
  InferCreationAttributes<AirdropTransactionLog>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare extrinsicHash: string;
  declare blockHash: string;
  declare account_id: number;
  declare blockNumber: number;
  declare amount: number;
  declare point: number;
  declare status: string;
  declare note: string;
}

AirdropTransactionLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    extrinsicHash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    blockHash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    blockNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    point: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(AirdropTransactionLogStatus.FAILED, AirdropTransactionLogStatus.SUCCESS),
      allowNull: true,
    },
    note: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'airdrop_transaction_log',
    sequelize: SequelizeServiceImpl.sequelize,
  },
);
export default AirdropTransactionLog;
