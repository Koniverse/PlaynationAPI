import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {AccountAttributeRank} from '@src/models/AccountAttribute';

export class ReferralUpgradeLog extends Model<InferAttributes<ReferralUpgradeLog>, InferCreationAttributes<ReferralUpgradeLog>> {
  declare id: CreationOptional<number>; // id on db
  declare referralLogId: number;
  declare sourceAccountId: number;
  declare invitedAccountId: number;
  declare point: number;
  declare indirectAccount: number;
  declare indirectPoint: number;
  declare rank: AccountAttributeRank;
}

ReferralUpgradeLog.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  referralLogId: {
    type: DataTypes.INTEGER,
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
  rank: {
    type: DataTypes.ENUM(AccountAttributeRank.IRON, AccountAttributeRank.BRONZE, AccountAttributeRank.SILVER, AccountAttributeRank.GOLD, AccountAttributeRank.PLATINUM, AccountAttributeRank.DIAMOND),
  },
}, {
  indexes: [{unique: false, fields: ['sourceAccountId', 'invitedAccountId']}],
  tableName: 'referral_upgrade_log',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default ReferralUpgradeLog;
