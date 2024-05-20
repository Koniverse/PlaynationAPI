import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import { AirdropCampaign } from './AirdropCampaign';

export class AirdropSnapshot extends Model<InferAttributes<AirdropSnapshot>, InferCreationAttributes<AirdropSnapshot>> {
  declare id: CreationOptional<number>;
  declare campaign_id: CreationOptional<number>;
  declare account: string;
  declare amount: number;
  declare network: string;
  declare snapshot_data: JSON;
  declare point_nps: number;
  declare created_at: CreationOptional<Date>;
}

AirdropSnapshot.init(
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
    account: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
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
    point_nps: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    indexes: [{ unique: false, fields: ['campaign_id'] }],
    sequelize: SequelizeServiceImpl.sequelize,
    modelName: 'AirdropSnapshot',
    timestamps: true,
    underscored: true,
    tableName: 'airdrop_records',
  },
);
