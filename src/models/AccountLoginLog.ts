import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import Account from '@src/models/Account';
export interface BrowserInfo {
  browser: Browser;
  os: Os;
  platform: Platform;
  engine: Engine;
}
interface Engine {
  name: string;
}
interface Platform {
  type: string;
  vendor: string;
}
interface Os {
  name: string;
  version: string;
  versionName: string;
}
interface Browser {
  name: string;
  version: string;
}
export class AccountLoginLog extends Model<InferAttributes<AccountLoginLog>, InferCreationAttributes<AccountLoginLog>> {
  declare id: CreationOptional<number>; // id on db
  declare accountId: number;
  declare ip: CreationOptional<string>;
  declare country: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare loginDate: CreationOptional<Date>;
  declare browserInfo: CreationOptional<BrowserInfo>;
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
  ip: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  browserInfo: {
    type: DataTypes.JSONB,
    allowNull: true,
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
