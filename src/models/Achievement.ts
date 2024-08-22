import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import AchievementCategory from '@src/models/AchievementCategory';
import {LeaderboardItem} from '@src/types';
export type Metric = LeaderboardItem & {metricId: string};

export enum AchievementType {
  LOGIN = 'login',
  TASK = 'task',
  GAME = 'game',
  REFERRAL = 'referral',
}



export class Achievement extends Model<InferAttributes<Achievement>, InferCreationAttributes<Achievement>> {
  declare id: CreationOptional<number>; // id on db
  declare contentId: number;
  declare slug: string;
  declare name: string;
  declare description: string;
  declare icon: string;
  declare achievementCategoryId: number;
  declare startTime: CreationOptional<Date>;
  declare endTime: CreationOptional<Date>;
  declare metrics: CreationOptional<Metric[]>; // metrics for achievement
  declare type: CreationOptional<AchievementType>;

  // createdAt can be undefined during creation
  declare createdAt: CreationOptional<Date>;
  // updatedAt can be undefined during creation
  declare updatedAt: CreationOptional<Date>;
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
  achievementCategoryId: {
    type: DataTypes.INTEGER,
    references: {
      model: AchievementCategory,
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
  type: {
    type: DataTypes.ENUM(AchievementType.GAME, AchievementType.LOGIN, AchievementType.REFERRAL, AchievementType.TASK),
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
