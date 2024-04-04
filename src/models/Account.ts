import {
  CreationOptional,
  DataTypes,
  HasOneCreateAssociationMixin,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import AccountAttribute from '@src/models/AccountAttribute';

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
}, {
  indexes: [{unique: true, fields: ['telegramId']}],
  tableName: 'account',
  sequelize: SequelizeServiceImpl.sequelize,
});

export default Account;
