import {
  CreationOptional,
  DataTypes,
  HasOneCreateAssociationMixin,
  InferAttributes,
  InferCreationAttributes,
  Model
} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import EventType from '@src/models/EventType';
import Account from '@src/models/Account';

export class Event extends Model<InferAttributes<Event>, InferCreationAttributes<Event>> {
  declare id: CreationOptional<number>; // id on db
  declare accountId: number;
  declare eventTypeId: number;
  declare startTime: Date;
  declare endTime: CreationOptional<Date>;
  declare token: string;

  declare energy: number;
  declare point: CreationOptional<number>;
  declare success: CreationOptional<boolean>;
  declare error: CreationOptional<string>;

  declare getAccount: HasOneCreateAssociationMixin<Account>;
  declare getEventType: HasOneCreateAssociationMixin<EventType>;
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
  startTime: {
    type: DataTypes.DATE,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  token: {
    type: DataTypes.STRING,
  },
  energy: {
    type: DataTypes.INTEGER,
  },
  point: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  success: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  error: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  indexes: [{unique: true, fields: ['id']}],
  tableName: 'account_attribute',
  sequelize: SequelizeServiceImpl.sequelize,
});

export default Event;
