import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';

export class TaskHistory extends Model<InferAttributes<TaskHistory>, InferCreationAttributes<TaskHistory>> {
  declare id: CreationOptional<number>; // id on db
  declare taskId: number;
  declare pointReward: number;
  declare inventoryId: CreationOptional<number>;
  declare createdAt: Date;
}

TaskHistory.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  taskId: {
    type: DataTypes.INTEGER,
  },
  pointReward: {
    type: DataTypes.INTEGER,
  },
  inventoryId: {
    type: DataTypes.INTEGER,
  },
  createdAt: {
    type: DataTypes.INTEGER,
  },
}, {
  indexes: [{unique: true, fields: ['taskId']}],
  tableName: 'task_history',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default TaskHistory;
