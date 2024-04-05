import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model,} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import Account from '@src/models/Account';

export enum WalletTypeEnum {
  EVM = 'EVM',
  SUBSTRATE = 'SUBSTRATE',
}

export interface WalletParams {
  address: string;
  type: WalletTypeEnum;
}

export class Wallet extends Model<InferAttributes<Wallet>, InferCreationAttributes<Wallet>> implements WalletParams {
  declare id: CreationOptional<number>; // id on db
  declare accountId: number;

  // Wallet information
  declare address: string;
  declare type: WalletTypeEnum;
}

Wallet.init({
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
  address: {
    type: DataTypes.STRING,
  },
  type: {
    type: DataTypes.ENUM,
    values: [WalletTypeEnum.EVM, WalletTypeEnum.SUBSTRATE],
  },
}, {
  indexes: [],
  tableName: 'wallet',
  sequelize: SequelizeServiceImpl.sequelize,
});

export default Wallet;
