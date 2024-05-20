import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';

import SequelizeServiceImpl from '@src/services/SequelizeService';

export class AirdropCampaign extends Model<InferAttributes<AirdropCampaign>, InferCreationAttributes<AirdropCampaign>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare icon: string;
  declare start_time: Date;
  declare end_time: Date;
  declare network: string;
  declare total_tokens: number;
  declare decimal: number;
  declare method: string;
  declare raffle_count: number;
  declare allocation: string;
  declare steps_time: string;
  declare eligibility_criteria: JSON;
  declare createdAt: CreationOptional<Date>;
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
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    network: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    total_tokens: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    decimal: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    method: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    raffle_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    allocation: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    steps_time: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    eligibility_criteria: {
      type: DataTypes.JSON,
      allowNull: false,
    },

    createdAt: {
      type: DataTypes.DATE,
    },
  },
  {
    indexes: [],
    tableName: 'airdrop_campaigns',
    sequelize: SequelizeServiceImpl.sequelize,
    createdAt: true,
  },
);

module.exports = AirdropCampaign;
