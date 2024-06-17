import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import { AirdropRecord } from './AirdropRecord';
import { Account } from '@src/models/Account';
import AirdropCampaign from '@src/models/AirdropCampaign';

export enum AIRDROP_LOG_STATUS {
  PENDING = 'PENDING',
  CLAIMING = 'CLAIMING',
  EXPIRED = 'EXPIRED',
  RECEIVED = 'RECEIVED',
}

export enum AIRDROP_LOG_TYPE {
  NPS = 'NPS',
  TOKEN = 'TOKEN',
}

export interface AirdropRecordLogAttributes {
  airdrop_log_id: number;
  type: string;
  expiryDate: Date;
  status: string;
  account_id: number;
  campaign_id: number;
  airdrop_record_id: number;
  eligibility_id: number;
  address: string;
  point: number;
  token: number;
  network: string;
  campaign_method: string;
  campaign_name: string;
  decimal: number;
  airdrop_record_status: string;
  eligibility_name?: string;
  eligibility_end?: Date;
}

export class AirdropRecordLog extends Model<
  InferAttributes<AirdropRecordLog>,
  InferCreationAttributes<AirdropRecordLog>
> {
  declare id: CreationOptional<number>;
  declare campaign_id: CreationOptional<number>;
  declare account_id: number;
  declare status: string;
  declare airdrop_record_id: CreationOptional<number>;
  declare eligibility_id: number;
  declare type: string;
  declare expiryDate: Date;
}

AirdropRecordLog.init(
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
      references: {
        model: Account,
        key: 'id',
      },
    },

    status: {
      type: DataTypes.ENUM(AIRDROP_LOG_STATUS.PENDING, AIRDROP_LOG_STATUS.EXPIRED, AIRDROP_LOG_STATUS.RECEIVED),
      defaultValue: AIRDROP_LOG_STATUS.PENDING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(AIRDROP_LOG_TYPE.NPS, AIRDROP_LOG_TYPE.TOKEN),
      allowNull: false,
    },
    eligibility_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'airdrop_record_log',
    sequelize: SequelizeServiceImpl.sequelize,
  },
);
export default AirdropRecordLog;
