import SequelizeServiceImpl from '@src/services/SequelizeService';
import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';

export enum AirdropCampaignStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CANCELED = 'CANCELED',
}

export class AirdropCampaign extends Model<InferAttributes<AirdropCampaign>, InferCreationAttributes<AirdropCampaign>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare icon: string;
  declare banner: string;
  declare start_snapshot: Date;
  declare end_snapshot: Date;
  declare start_claim: Date;
  declare end_claim: Date;
  declare eligibility_date: Date;
  declare network: string;
  declare total_tokens: number;
  declare symbol: string;
  declare decimal: number;
  declare method: string;
  declare raffle_count: number;
  declare eligibility_criteria: JSON;
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
    eligibility_date: {
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
    eligibility_criteria: {
      type: DataTypes.JSON,
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
    start: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end: {
      type: DataTypes.DATE,
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
