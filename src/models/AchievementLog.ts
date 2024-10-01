import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import Account from '@src/models/Account';
import Achievement from '@src/models/Achievement';
import AchievementMilestone from '@src/models/AchievementMilestone';


export enum AchievementLogStatus {
  PENDING = 'pending',
  CLAIMED = 'claimed',
}
export class AchievementLog extends Model<InferAttributes<AchievementLog>, InferCreationAttributes<AchievementLog>> {
  declare id: CreationOptional<number>; // id on db
  declare accountId: number;
  declare achievementId: number;
  declare achievementMilestoneId: number;
  declare pointReward: number;
  declare status: CreationOptional<AchievementLogStatus>;
  declare completedAt: CreationOptional<Date>;

  // createdAt can be undefined during creation
  declare createdAt: CreationOptional<Date>;
  // updatedAt can be undefined during creation
  declare updatedAt: CreationOptional<Date>;
}

AchievementLog.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  accountId: {
    type: DataTypes.INTEGER,
    references: {
      model: Account,
      key: 'id',
    },
  },
  achievementId: {
    type: DataTypes.INTEGER,
    references: {
      model: Achievement,
      key: 'id',
    },
  },
  achievementMilestoneId: {
    type: DataTypes.INTEGER,
    references: {
      model: AchievementMilestone,
      key: 'id',
    },
  },
  pointReward: {
    type: DataTypes.INTEGER,
  },
  status: {
    type: DataTypes.ENUM(AchievementLogStatus.PENDING, AchievementLogStatus.CLAIMED),
    defaultValue: AchievementLogStatus.PENDING,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
    
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,

}, {
  indexes: [{unique: true, fields: ['accountId', 'achievementMilestoneId']}],
  tableName: 'achievement_log',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default AchievementLog;