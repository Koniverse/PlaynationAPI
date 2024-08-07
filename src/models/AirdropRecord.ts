import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';

export enum AirdropRecordsStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export class AirdropRecord extends Model<InferAttributes<AirdropRecord>, InferCreationAttributes<AirdropRecord>> {
  declare id: CreationOptional<number>;
  declare campaign_id: CreationOptional<number>;
  declare accountId: number;
  declare token: number;
  declare symbol: string;
  declare decimal: number;
  declare network: string;
  declare token_slug: CreationOptional<string>;
  declare status: string;
  declare snapshot_data: JSON;
  declare point: number;
  declare eligibility_id: number;
  declare use_point: number;
  declare created_at: CreationOptional<Date>;
}

AirdropRecord.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    campaign_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    token: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    network: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    token_slug: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    snapshot_data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    point: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(AirdropRecordsStatus.OPEN, AirdropRecordsStatus.CLOSED),
      defaultValue: AirdropRecordsStatus.CLOSED,
      allowNull: false,
    },
    symbol: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    decimal: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    eligibility_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    use_point: {
      type: DataTypes.INTEGER,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    indexes: [],
    sequelize: SequelizeServiceImpl.sequelize,
    modelName: 'AirdropRecord',
    timestamps: true,
    underscored: true,
    tableName: 'airdrop_records',
  },
);
export default AirdropRecord;
