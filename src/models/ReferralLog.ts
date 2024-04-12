import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';

export class ReferralLog extends Model<InferAttributes<ReferralLog>, InferCreationAttributes<ReferralLog>> {
  declare id: CreationOptional<number>; // id on db
  declare accountReceiveId: number;
  declare accountFromId: number;
  declare point: number;
}

ReferralLog.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  accountReceiveId: {
    type: DataTypes.INTEGER,
  },
  accountFromId: {
    type: DataTypes.INTEGER,
  },
  point: {
    type: DataTypes.INTEGER,
  },
}, {
  indexes: [{unique: true, fields: ['accountReceiveId', 'accountFromId']}],
  tableName: 'referral_log',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default ReferralLog;
