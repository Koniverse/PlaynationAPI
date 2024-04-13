import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import Account from '@src/models/Account';

export enum AccountAttributeRank {
  IRON = 'iron',
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}


export class AccountAttribute extends Model<InferAttributes<AccountAttribute>, InferCreationAttributes<AccountAttribute>> {
  declare id: CreationOptional<number>; // id on db
  
  // Telegram information
  declare accountId: number;
  declare lastEnergyUpdated: Date;
  declare energy: number;
  declare point: number;
  declare accumulatePoint: number;
  declare rank: AccountAttributeRank;
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
  accumulatePoint: {
    type: DataTypes.INTEGER,
  },
  point: {
    type: DataTypes.INTEGER,
  },
  rank: {
    type: DataTypes.ENUM(AccountAttributeRank.IRON, AccountAttributeRank.BRONZE, AccountAttributeRank.SILVER, AccountAttributeRank.GOLD, AccountAttributeRank.PLATINUM, AccountAttributeRank.DIAMOND),
  },
}, {
  indexes: [],
  tableName: 'account_attribute',
  sequelize: SequelizeServiceImpl.sequelize,
});

export default AccountAttribute;
