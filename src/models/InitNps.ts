import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import Account from '@src/models/Account';

export class InitNps extends Model<InferAttributes<InitNps>, InferCreationAttributes<InitNps>> {
  declare id: CreationOptional<number>; // id on db
  declare accountId: number;
  declare point: number;
  declare telegramId: number;
  declare groupId: string;
  declare note: CreationOptional<string>;
}

InitNps.init({
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
  point: {
    type: DataTypes.INTEGER,
  },
  telegramId: {
    type: DataTypes.INTEGER,
  },
  groupId: {
    type: DataTypes.STRING,
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  indexes: [{unique: true, fields: ['accountId', 'telegramId', 'groupId']}],
  tableName: 'init_nps',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default InitNps;
