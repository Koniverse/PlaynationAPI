import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import Account from '@src/models/Account';

export interface InitNpsMetadata {
  telegramId: number;
  groupId: number;
  messageCount: number;
  timeSinceJoin: Date;
}

export class InitNps extends Model<InferAttributes<InitNps>, InferCreationAttributes<InitNps>> {
  declare id: CreationOptional<number>; // id on db
  declare accountId: number;
  declare point: number;
  declare metadata: CreationOptional<InitNpsMetadata[]>;
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
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  indexes: [],
  tableName: 'init_nps',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default InitNps;
