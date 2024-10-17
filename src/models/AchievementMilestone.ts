import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';

export enum ConditionsCombination {
  AND = 'and',
  OR = 'or',
}

export enum ComparisonOperator {
    GT = 'gt',
    GTE = 'gte',
    LT = 'lt',
    LTE = 'lte',
    EQ = 'eq',
    RANK_GT = 'rank_gt',
    RANK_GTE = 'rank_gte',
    RANK_LT = 'rank_lt',
    RANK_LTE = 'rank_lte',
    RANK_EQ = 'rank_eq'
}

export interface Condition {
    metric: string;
    comparison: ComparisonOperator;
    value: number;
}

export class AchievementMilestone extends Model<InferAttributes<AchievementMilestone>, InferCreationAttributes<AchievementMilestone>> {
  declare id: CreationOptional<number>; // id on db
  declare name: string;
  declare conditions: CreationOptional<Condition[]>;
  declare nps: number;
  declare achievementId: number;
  declare contentId: number;
  declare conditions_combination: CreationOptional<ConditionsCombination>;
  // createdAt can be undefined during creation
  declare createdAt: CreationOptional<Date>;
  // updatedAt can be undefined during creation
  declare updatedAt: CreationOptional<Date>;
  declare slug: CreationOptional<string>;
}

AchievementMilestone.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  conditions: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  nps: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  achievementId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  contentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  
  conditions_combination: {                             
    type: DataTypes.ENUM(ConditionsCombination.AND, ConditionsCombination.OR),
    allowNull: true,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,

}, {
  indexes: [],
  tableName: 'achievement_milestone',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default AchievementMilestone;
