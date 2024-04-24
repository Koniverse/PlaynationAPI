import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';

export class ReferralLog extends Model<InferAttributes<ReferralLog>, InferCreationAttributes<ReferralLog>> {
  declare id: CreationOptional<number>; // id on db
  declare sourceAccountId: number;
  declare invitedAccountId: number;
  declare point: number;
  declare indirectAccount: number;
  declare indirectPoint: number;
  declare invitePoint: number;
  declare receiverInviteRatio: number;
}

ReferralLog.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sourceAccountId: {
    type: DataTypes.INTEGER,
  },
  invitedAccountId: {
    type: DataTypes.INTEGER,
  },
  point: {
    type: DataTypes.INTEGER,
  },
  indirectAccount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  indirectPoint: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  invitePoint: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  receiverInviteRatio: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  indexes: [{unique: true, fields: ['sourceAccountId', 'invitedAccountId']}],
  tableName: 'referral_log',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default ReferralLog;
