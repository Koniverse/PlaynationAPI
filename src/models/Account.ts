import {
  CreationOptional,
  DataTypes, HasManyCreateAssociationMixin,
  HasOneCreateAssociationMixin,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import AccountAttribute from '@src/models/AccountAttribute';
import Wallet from '@src/models/Wallet';

export interface ITelegramParams {
  telegramId: number;
  telegramUsername: string;
  isBot: boolean;
  firstName: string;
  lastName: string;
  photoUrl: string;
  languageCode: string;
}


export class Account extends Model<InferAttributes<Account>, InferCreationAttributes<Account>> implements ITelegramParams {
  declare id: CreationOptional<number>; // id on db
  
  // Telegram information
  declare telegramId: number;
  declare telegramUsername: string;
  declare isBot: boolean;
  declare firstName: string;
  declare lastName: string;
  declare photoUrl: string;
  declare languageCode: string;
  
  // Account information
  declare getAccountAttribute: HasOneCreateAssociationMixin<AccountAttribute>;
  declare getWallets: HasManyCreateAssociationMixin<Wallet>;
  // createdAt can be undefined during creation
  declare createdAt: CreationOptional<Date>;
  // updatedAt can be undefined during creation
  declare updatedAt: CreationOptional<Date>;
}

Account.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  telegramId: {
    type: DataTypes.BIGINT,
  },
  telegramUsername: {
    type: DataTypes.STRING,
  },
  isBot: {
    type: DataTypes.BOOLEAN,
  },
  firstName: {
    type: DataTypes.STRING,
  },
  lastName: {
    type: DataTypes.STRING,
  },
  photoUrl: {
    type: DataTypes.STRING,
  },
  languageCode: {
    type: DataTypes.STRING,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  indexes: [{unique: true, fields: ['telegramId']}],
  tableName: 'account',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default Account;
