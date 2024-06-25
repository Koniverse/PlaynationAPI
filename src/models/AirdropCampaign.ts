import SequelizeServiceImpl from '@src/services/SequelizeService';
import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';

export enum AirdropCampaignStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CANCELED = 'CANCELED',
}

export interface AirdropCampaignInterface {
  id: number;
  name: string;
  icon: string;
  banner: string;
  start_snapshot: Date;
  end_snapshot: Date;
  start_claim: Date;
  end_claim: Date;
  network: string;
  total_tokens: number;
  symbol: string;
  decimal: number;
  method: string;
  raffle_count: number;
  start: Date;
  end: Date;
  description: Text;
  tokenDistributions: JSON;
  npsDistributions: JSON;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AirdropCampaign extends Model<InferAttributes<AirdropCampaign>, InferCreationAttributes<AirdropCampaign>> {
  declare id: CreationOptional<number>;
  declare content_id: CreationOptional<number>;
  declare name: string;
  declare icon: string;
  declare banner: string;
  declare start_snapshot: Date;
  declare end_snapshot: Date;
  declare start_claim: Date;
  declare end_claim: Date;
  declare network: string;
  declare total_tokens: number;
  declare symbol: string;
  declare decimal: number;
  declare method: string;
  declare raffle_count: number;
  declare tokenDistributions: JSON;
  declare npsDistributions: JSON;
  declare description: Text;
  declare shortDescription: string;
  declare start: Date;
  declare end: Date;
  declare status: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

AirdropCampaign.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    content_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    banner: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    start_snapshot: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_snapshot: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    start_claim: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_claim: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    network: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    total_tokens: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    symbol: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'KAR',
    },
    decimal: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    method: {
      type: DataTypes.ENUM('RAFFLE'),
      allowNull: false,
    },
    raffle_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        AirdropCampaignStatus.ACTIVE,
        AirdropCampaignStatus.INACTIVE,
        AirdropCampaignStatus.CANCELED,
      ),
      defaultValue: AirdropCampaignStatus.INACTIVE,
      allowNull: false,
    },
    npsDistributions: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    tokenDistributions: {
      type: DataTypes.JSON,
      allowNull: false,
    },

    start: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
    },
    shortDescription: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: new Date(),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: new Date(),
    },
  },
  {
    indexes: [],
    tableName: 'airdrop_campaigns',
    sequelize: SequelizeServiceImpl.sequelize,
    createdAt: true,
    updatedAt: true,
  },
);

export default AirdropCampaign;
