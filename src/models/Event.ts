import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import EventType from '@src/models/EventType';
import Account from '@src/models/Account';

export class Event extends Model<InferAttributes<Event>, InferCreationAttributes<Event>> {
  declare id: CreationOptional<number>; // id on db
  declare accountId: Account;
  declare eventTypeId: EventType;
  declare timestamp: number;
  declare eventTime: Date;

  declare energy: number;
  declare point: bigint;
}

Event.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  eventTypeId: {
    type: DataTypes.INTEGER,
    references: {
      model: EventType,
      key: 'id',
    },
  },
  accountId: {
    type: DataTypes.INTEGER,
    references: {
      model: Account,
      key: 'id',
    },
  },
  timestamp: {
    type: DataTypes.BIGINT,
  },
  eventTime: {
    type: DataTypes.DATE,
  },
  energy: {
    type: DataTypes.INTEGER,
  },
  point: {
    type: DataTypes.BIGINT,
  },
}, {
  indexes: [{unique: true, fields: ['id']}],
  tableName: 'account_attribute',
  sequelize: SequelizeServiceImpl.sequelize,
});

export default Event;
