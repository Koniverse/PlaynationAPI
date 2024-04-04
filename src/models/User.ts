import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {AccountType} from '@src/types';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>; // id on db
  declare address: string;
  declare name: string;
  declare randomCode: string;
  declare type: AccountType;
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  address: {
    type: DataTypes.STRING,
  },
  name: {
    type: DataTypes.STRING,
  },
  type: {
    type: DataTypes.ENUM,
    values: [AccountType.ETHEREUM, AccountType.SUBSTRATE],
  },
  randomCode: {
    type: DataTypes.STRING,
  },
}, {
  indexes: [{unique: true, fields: ['address']}],
  tableName: 'user',
  sequelize: SequelizeServiceImpl.sequelize,
});

export default User;