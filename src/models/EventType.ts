import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';

export enum EventTypeEnum {
  GAMEPLAY = 'GAMEPLAY',
  TASK = 'TASK',
  EVENT = 'EVENT',
}

export class EventType extends Model<InferAttributes<EventType>, InferCreationAttributes<EventType>> {
  declare id: CreationOptional<number>; // id on db
  declare name: string;
  declare description: string;
  declare type: EventTypeEnum;
  declare requireValidate: boolean;
  declare canRepeat: boolean;
  declare repeatInterval: number; // in seconds

  declare startTime: Date;
  declare stopTime: Date;
  declare icon: string;
  declare banner: string;

  declare energy: number;
  declare point: number;
  declare minPoint: number;
  declare maxPoint: number;
}

EventType.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.STRING,
  },
  type: {
    type: DataTypes.ENUM,
    values: [EventTypeEnum.GAMEPLAY, EventTypeEnum.TASK, EventTypeEnum.EVENT],
  },
  canRepeat: {
    type: DataTypes.BOOLEAN,
  },
  requireValidate: {
    type: DataTypes.BOOLEAN,
  },
  repeatInterval: {
    type: DataTypes.INTEGER,
  },
  startTime: {
    type: DataTypes.DATE,
  },
  stopTime: {
    type: DataTypes.DATE,
  },
  icon: {
    type: DataTypes.STRING,
  },
  banner: {
    type: DataTypes.STRING,
  },
  energy: {
    type: DataTypes.INTEGER,
  },
  point: {
    type: DataTypes.INTEGER,
  },
  minPoint: {
    type: DataTypes.INTEGER,
  },
  maxPoint: {
    type: DataTypes.INTEGER,
  },
}, {
  indexes: [{unique: true, fields: ['id']}],
  tableName: 'event_type',
  sequelize: SequelizeServiceImpl.sequelize,
});

export default EventType;
