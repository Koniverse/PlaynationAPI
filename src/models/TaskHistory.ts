import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import Task from '@src/models/Task';
import Account from '@src/models/Account';
export enum TaskHistoryStatus {
  FAILED = 'failed',
  CHECKING = 'checking',
  COMPLETED = 'completed',
}
export class TaskHistory extends Model<InferAttributes<TaskHistory>, InferCreationAttributes<TaskHistory>> {
  declare id: CreationOptional<number>; // id on db
  declare taskId: number;
  declare accountId: number;
  declare pointReward: number;
  declare inventoryId: CreationOptional<number>;
  declare network: string | undefined;
  declare extrinsicHash: string | undefined;
  declare status: CreationOptional<TaskHistoryStatus>;
  declare retry: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
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
  network: {
    type: DataTypes.STRING,
  },
  retry: {
    type: DataTypes.INTEGER,
  },
  extrinsicHash: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.ENUM(TaskHistoryStatus.FAILED, TaskHistoryStatus.CHECKING, TaskHistoryStatus.COMPLETED),
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  indexes: [{unique: false, fields: ['accountId', 'taskId']}, {unique: false, fields: ['accountId']}],
  tableName: 'task_history',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default TaskHistory;
