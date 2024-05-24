import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import { AirdropCampaign } from './AirdropCampaign';

export enum AirdropRecordsStatus {
  NEW_REGISTRATION = 'NEW_REGISTRATION',
  CHECKING_CONDITIONS = 'CHECKING_CONDITIONS',
  PASS_CONDITION_CHECK = 'PASS_CONDITION_CHECK',
  ELIGIBLE_FOR_REWARD = 'ELIGIBLE_FOR_REWARD',
  RECEIVED = 'RECEIVED',
  NOT_ELIGIBLE_FOR_REWARD = 'NOT_ELIGIBLE_FOR_REWARD',
  CANCELED = 'CANCELED',
}

export class AirdropRecord extends Model<InferAttributes<AirdropRecord>, InferCreationAttributes<AirdropRecord>> {
  declare id: CreationOptional<number>;
  declare campaign_id: CreationOptional<number>;
  declare accountId: number;
  declare token: number;
  declare symbol: string;
  declare decimal: number;
  declare network: string;
  declare status: string;
  declare snapshot_data: JSON;
  declare point: number;
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
      references: {
        model: AirdropCampaign,
        key: 'id',
      },
    },
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    token: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    network: {
      type: DataTypes.STRING,
      allowNull: false,
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
      type: DataTypes.ENUM(
        AirdropRecordsStatus.NEW_REGISTRATION,
        AirdropRecordsStatus.CHECKING_CONDITIONS,
        AirdropRecordsStatus.ELIGIBLE_FOR_REWARD,
        AirdropRecordsStatus.RECEIVED,
        AirdropRecordsStatus.NOT_ELIGIBLE_FOR_REWARD,
        AirdropRecordsStatus.PASS_CONDITION_CHECK,
        AirdropRecordsStatus.CANCELED,
      ),
      defaultValue: AirdropRecordsStatus.NEW_REGISTRATION,
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
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    indexes: [{ unique: false, fields: ['campaign_id'] }],
    sequelize: SequelizeServiceImpl.sequelize,
    modelName: 'AirdropRecord',
    timestamps: true,
    underscored: true,
    tableName: 'airdrop_records',
  },
);
export default AirdropRecord;
