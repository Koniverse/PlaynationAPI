import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import { ExtensionAccountType} from '@src/types';

export class Faucet extends Model<InferAttributes<Faucet>, InferCreationAttributes<Faucet>> {
  declare id: CreationOptional<number>; // id on db
  declare address: string;
  declare decimal: number;
  declare amount: number;
  declare signature: string;
  declare txHash: string;
  declare faucet_network: string;
  declare faucet_amount: number;
  declare transaction: boolean;
  declare extension_type: ExtensionAccountType;
}

Faucet.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  address: {
    type: DataTypes.STRING,
  },
  decimal: {
    type: DataTypes.INTEGER,
  },
  transaction: {
    type: DataTypes.BOOLEAN,
  },
  amount: {
    type: DataTypes.INTEGER,
  },
  signature: {
    type: DataTypes.STRING,
  },
  txHash: {
    type: DataTypes.STRING,
  },
  extension_type: {
    type: DataTypes.ENUM,
    values: [ExtensionAccountType.SUBWALLET, ExtensionAccountType.POLKADOT],
  },
  faucet_network: {
    type: DataTypes.STRING,
  },
  faucet_amount: {
    type: DataTypes.INTEGER,
  },
}, {
  indexes: [{unique: true, fields: ['address']}],
  tableName: 'faucet',
  sequelize: SequelizeServiceImpl.sequelize,
});

export default Faucet;
