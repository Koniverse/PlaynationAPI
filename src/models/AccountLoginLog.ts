import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import Account from '@src/models/Account';
export class AccountLoginLog extends Model<InferAttributes<AccountLoginLog>, InferCreationAttributes<AccountLoginLog>> {
  declare id: CreationOptional<number>; // id on db
  declare accountId: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare loginDate: CreationOptional<Date>;
}

AccountLoginLog.init({
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
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  loginDate: DataTypes.DATE,
}, {
  indexes: [],
  tableName: 'account_login_log',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default AccountLoginLog;
