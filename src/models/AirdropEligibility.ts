import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import AirdropCampaign from '@src/models/AirdropCampaign';

export interface AirdropEligibilityInterface {
  id: number;
  airdrop_campaign: AirdropCampaign;
  campaign_id: AirdropCampaign;
  userId: number;
  name: string;
  userList: JSON;
  boxCount: number;
}

export class AirdropEligibility extends Model<
  InferAttributes<AirdropEligibility>,
  InferCreationAttributes<AirdropEligibility>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare campaign_id: CreationOptional<number>;
  declare userList: JSON;
  declare boxCount: number;
  declare created_at: CreationOptional<Date>;
}

AirdropEligibility.init(
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
    },
    boxCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userList: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    indexes: [],
    sequelize: SequelizeServiceImpl.sequelize,
    modelName: 'AirdropEligibility',
    timestamps: true,
    underscored: true,
    tableName: 'airdrop_eligibility',
  },
);
export default AirdropEligibility;
