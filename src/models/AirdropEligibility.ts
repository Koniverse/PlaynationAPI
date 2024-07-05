import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import AirdropCampaign from '@src/models/AirdropCampaign';
import { Enum } from '@polkadot/types-codec';

export interface AirdropEligibilityInterface {
  id: number;
  airdrop_campaign: AirdropCampaign;
  campaign_id: AirdropCampaign;
  userId: number;
  name: string;
  userList: JSON;
  boxCount: number;
  boxPrice: number;
  boxLimit: number;
  type: string;
  start: Date;
  end: Date;
  note: string;
}

enum EligibilityType {
  SOCIAL = 'social',
  INVITE = 'invite',
  NPS = 'nps',
}

export class AirdropEligibility extends Model<
  InferAttributes<AirdropEligibility>,
  InferCreationAttributes<AirdropEligibility>
> {
  declare id: CreationOptional<number>;
  declare content_id: CreationOptional<number>;
  declare name: string;
  declare campaign_id: CreationOptional<number>;
  declare userList: JSON;
  declare boxCount: number;
  declare boxPrice: number;
  declare boxLimit: number;
  declare type: Enum;
  declare start: Date;
  declare end: Date;
  declare note: string;
}

AirdropEligibility.init(
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
    campaign_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    boxCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    boxPrice: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    boxLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    userList: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(EligibilityType.NPS, EligibilityType.SOCIAL, EligibilityType.INVITE),
      defaultValue: EligibilityType.NPS,
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
    note: {
      type: DataTypes.STRING,
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
