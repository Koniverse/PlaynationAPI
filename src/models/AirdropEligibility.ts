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
  type: string;
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
  declare name: string;
  declare campaign_id: CreationOptional<number>;
  declare userList: JSON;
  declare boxCount: number;
  declare type: Enum;
  declare created_at: CreationOptional<Date>;

  static associate(models: any) {
    AirdropEligibility.belongsTo(models.AirdropCampaign, {
      foreignKey: 'campaign_id',
      as: 'campaign',
    });
  }
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
      references: {
        model: AirdropCampaign,
        key: 'id',
      },
    },
    boxCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
