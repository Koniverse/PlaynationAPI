import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';

export interface AirlyftEventWebhook {
  userId: string;
  provider: string;
  providerId: string;
  xp: number;
  points: number;
  data: string;
  taskId: string;
  eventId: string;
  tasktype: string;
  apptype: string;
}

export class AirlyftEvent extends Model<InferAttributes<AirlyftEvent>, InferCreationAttributes<AirlyftEvent>> {
  declare id: CreationOptional<number>; // id on db

  declare userId: string;
  declare taskId: string;
  declare eventId: string;
  declare xp: number;
  declare point: number;
  declare provider: string;
  declare providerId: string;
  declare tasktype: string;
  declare apptype: string;
  declare status: CreationOptional<string>;
  declare content: AirlyftEventWebhook;
  declare data: JSON;

  // createdAt can be undefined during creation
  declare createdAt: CreationOptional<Date>;
  // updatedAt can be undefined during creation
  declare updatedAt: CreationOptional<Date>;
}

AirlyftEvent.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  taskId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  providerId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  eventId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  content: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  xp: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  point: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  provider: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tasktype: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  apptype: {
    type: DataTypes.STRING,
    allowNull: true,
  },
    
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,

}, {
  indexes: [],
  tableName: 'airlyft_events',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default AirlyftEvent;
