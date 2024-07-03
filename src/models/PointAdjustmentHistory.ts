import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import Account from '@src/models/Account';
import AirdropCampaign from "@src/models/AirdropCampaign";

export class PointAdjustmentHistory extends Model<InferAttributes<PointAdjustmentHistory>, InferCreationAttributes<PointAdjustmentHistory>> {
  declare id: CreationOptional<number>; // id on db
  declare accountId: number;
  declare campaignId: number;
  declare point: number;
  declare note: CreationOptional<string>;
}

PointAdjustmentHistory.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  accountId: {
    type: DataTypes.INTEGER,
    references: {
      model: Account,
      key: 'id',
    },
  },
  campaignId: {
    type: DataTypes.INTEGER,
    references: {
      model: AirdropCampaign,
      key: 'id',
    },
  },
  point: {
    type: DataTypes.INTEGER,
  },
  note: {
    type: DataTypes.TEXT,
  },
}, {
  indexes: [],
  tableName: 'point_adjustment_history',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default PointAdjustmentHistory;
