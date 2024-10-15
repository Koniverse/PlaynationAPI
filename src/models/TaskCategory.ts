import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';

export enum TaskCategoryType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  FEATURED = 'featured',
}

export class TaskCategory extends Model<InferAttributes<TaskCategory>, InferCreationAttributes<TaskCategory>> {
  declare id: CreationOptional<number>; // id on db
  declare slug: string;
  declare name: string;
  declare description: string;
  declare icon: string;
  declare contentId: number;
  declare active: boolean;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare documentId: CreationOptional<string>;
  declare type: CreationOptional<TaskCategoryType>;
}

TaskCategory.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  slug: {
    type: DataTypes.STRING,
  },
  name: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.STRING,
  },
  icon: {
    type: DataTypes.STRING,
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  contentId: {
    type: DataTypes.INTEGER,
  },  
  documentId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM(TaskCategoryType.DAILY, TaskCategoryType.WEEKLY, TaskCategoryType.FEATURED),
    allowNull: true,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
}, {
  tableName: 'task_category',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default TaskCategory;
