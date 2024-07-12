import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';



export class AirlyftAccount extends Model<InferAttributes<AirlyftAccount>, InferCreationAttributes<AirlyftAccount>> {
  declare id: CreationOptional<number>; // id on db

  declare userId: string;
  declare telegramId: string;
  declare discordId: CreationOptional<string>;
  declare twitterId: CreationOptional<string>;
  declare evmAddress: CreationOptional<string>;
  // createdAt can be undefined during creation
  declare createdAt: CreationOptional<Date>;
  // updatedAt can be undefined during creation
  declare updatedAt: CreationOptional<Date>;
}

AirlyftAccount.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  discordId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  twitterId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  telegramId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  evmAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
    
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,

}, {
  indexes: [],
  tableName: 'airlyft_account',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default AirlyftAccount;
