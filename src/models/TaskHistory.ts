import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import Task from '@src/models/Task';
import Account from '@src/models/Account';

export class TaskHistory extends Model<InferAttributes<TaskHistory>, InferCreationAttributes<TaskHistory>> {
  declare id: CreationOptional<number>; // id on db
  declare taskId: number;
  declare accountId: number;
  declare pointReward: number;
  declare inventoryId: CreationOptional<number>;
}

TaskHistory.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  taskId: {
    type: DataTypes.INTEGER,
    references: {
      model: Task,
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
  pointReward: {
    type: DataTypes.INTEGER,
  },
  inventoryId: {
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
