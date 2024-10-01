import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import Game from '@src/models/Game';
import TaskCategory from '@src/models/TaskCategory';

export interface AchievementData {
  id: number;
  from_date: string;
  to_date: string;
  value: number;
  type: string;
}

export class Task extends Model<InferAttributes<Task>, InferCreationAttributes<Task>> {
  declare id: CreationOptional<number>; // id on db
  declare gameId: CreationOptional<number>;
  declare categoryId: CreationOptional<number>;
  declare contentId: number;
  declare slug: string;
  declare name: string;
  declare description: string;
  declare icon: string;
  declare url: string;
  declare pointReward: number;
  declare itemReward: CreationOptional<number>;
  declare onChainType: CreationOptional<string>;
  declare network: CreationOptional<string>;
  declare interval: CreationOptional<number>;
  declare startTime: CreationOptional<Date>;
  declare endTime: CreationOptional<Date>;
  declare share_leaderboard: CreationOptional<JSON>;
  declare achievement: CreationOptional<JSON>;
  declare active: boolean;
  declare airlyftType: CreationOptional<string>;
  declare airlyftId: CreationOptional<string>;
  declare airlyftEventId: CreationOptional<string>;
  declare airlyftWidgetId: CreationOptional<string>;
  declare documentId: CreationOptional<string>;
}

Task.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  contentId: {
    type: DataTypes.INTEGER,
  },
  gameId: {
    type: DataTypes.INTEGER,
    references: {
      model: Game,
      key: 'id',
    },
  },
  categoryId: {
    type: DataTypes.INTEGER,
    references: {
      model: TaskCategory,
      key: 'id',
    },
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
  url: {
    type: DataTypes.STRING,
  },
  pointReward: {
    type: DataTypes.INTEGER,
  },
  itemReward: {
    type: DataTypes.INTEGER,
  },
  interval: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  onChainType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  network: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  share_leaderboard: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  achievement: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  airlyftId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  airlyftType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  airlyftEventId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  airlyftWidgetId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  documentId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  indexes: [{unique: true, fields: ['slug']}],
  tableName: 'task',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default Task;
