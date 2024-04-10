import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import Account from '@src/models/Account';

export class AccountAttribute extends Model<InferAttributes<AccountAttribute>, InferCreationAttributes<AccountAttribute>> {
  declare id: CreationOptional<number>; // id on db
  
  // Telegram information
  declare accountId: number;
  declare lastEnergyUpdated: Date;
  declare energy: number;
  declare point: number;
}

AccountAttribute.init({
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
  energy: {
    type: DataTypes.INTEGER,
  },
  lastEnergyUpdated: {
    type: DataTypes.DATE,
  },
  point: {
    type: DataTypes.INTEGER,
  },
}, {
  indexes: [],
  tableName: 'account_attribute',
  sequelize: SequelizeServiceImpl.sequelize,
});

export default AccountAttribute;
