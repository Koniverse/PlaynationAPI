import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import { AirdropCampaign } from './AirdropCampaign';

export class AirdropSnapshot extends Model<InferAttributes<AirdropSnapshot>, InferCreationAttributes<AirdropSnapshot>> {
  declare id: CreationOptional<number>;
  declare campaign_id: CreationOptional<number>;
  declare accountId: number;
  declare token: number;
  declare symbol: string;
  declare decimal: number;
  declare network: string;
  declare snapshot_data: JSON;
  declare point: number;
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
    modelName: 'AirdropSnapshot',
    timestamps: true,
    underscored: true,
    tableName: 'airdrop_snapshot',
  },
);
export default AirdropSnapshot;
