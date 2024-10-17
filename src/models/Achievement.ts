import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {LeaderboardItem} from '@src/types';
import TaskCategory from '@src/models/TaskCategory';
export type Metric = LeaderboardItem & {metricId: string};

export enum RepeatableType {
  NON_REPEATABLE = 'non_repeatable',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

export enum LogViewType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
}

export class Achievement extends Model<InferAttributes<Achievement>, InferCreationAttributes<Achievement>> {
  declare id: CreationOptional<number>; // id on db
  declare contentId: number;
  declare slug: string;
  declare name: string;
  declare description: string;
  declare icon: string;
  declare taskCategoryId: number;
  declare startTime: CreationOptional<Date>;
  declare endTime: CreationOptional<Date>;
  declare metrics: CreationOptional<Metric[]>; // metrics for achievement
  declare repeatable: CreationOptional<RepeatableType>;
  declare logViewType: CreationOptional<LogViewType>;

  // createdAt can be undefined during creation
  declare createdAt: CreationOptional<Date>;
  // updatedAt can be undefined during creation
  declare updatedAt: CreationOptional<Date>;
  declare documentId: CreationOptional<string>;
}

Achievement.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  contentId: {
    type: DataTypes.INTEGER,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  taskCategoryId: {
    type: DataTypes.INTEGER,
    references: {
      model: TaskCategory,
      key: 'id',
    },
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  metrics: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  repeatable: {
    type: DataTypes.ENUM(RepeatableType.NON_REPEATABLE, RepeatableType.DAILY, RepeatableType.WEEKLY),
    allowNull: true,
  },
  logViewType: {
    type: DataTypes.ENUM(LogViewType.SINGLE, LogViewType.MULTIPLE),
    allowNull: true,
  },
  documentId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,

}, {
  indexes: [],
  tableName: 'achievement',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default Achievement;
