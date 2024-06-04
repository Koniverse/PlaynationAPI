import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import { AirdropRecord } from './AirdropRecord';
import AirdropCampaign from '@src/models/AirdropCampaign';

export enum AIRDROP_LOG_STATUS {
  PENDING = 'PENDING',
  MISSED = 'MISSED',
  RECEIVED = 'RECEIVED',
}

export enum AIRDROP_LOG_TYPE {
  NPS = 'NPS',
  TOKEN = 'TOKEN',
}

export class AirdropRecordLog extends Model<
  InferAttributes<AirdropRecordLog>,
  InferCreationAttributes<AirdropRecordLog>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare campaign_id: CreationOptional<number>;
  declare campaign_method: string;
  declare amount: number;
  declare point: number;
  declare decimal: number;
  declare account_id: number;
  declare address: string;
  declare status: string;
  declare network: string;
  declare type: string;
  declare airdrop_record_id: CreationOptional<number>;
  declare eligibilityId: number;
  declare eligibilityName: string;
}

AirdropRecordLog.init(
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
    campaign_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: AirdropCampaign,
        key: 'id',
      },
    },
    campaign_method: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    point: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    decimal: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    network: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    airdrop_record_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: AirdropRecord,
        key: 'id',
      },
    },
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(AIRDROP_LOG_STATUS.PENDING, AIRDROP_LOG_STATUS.MISSED, AIRDROP_LOG_STATUS.RECEIVED),
      defaultValue: AIRDROP_LOG_STATUS.PENDING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(AIRDROP_LOG_TYPE.NPS, AIRDROP_LOG_TYPE.TOKEN),
      allowNull: false,
    },
    eligibilityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    eligibilityName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'airdrop_record_log',
    sequelize: SequelizeServiceImpl.sequelize,
  },
);
export default AirdropRecordLog;
