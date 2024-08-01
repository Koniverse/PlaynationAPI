import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';

export class Leaderboard extends Model<InferAttributes<Leaderboard>, InferCreationAttributes<Leaderboard>> {
  declare id: CreationOptional<number>; // id on db
  declare name: string;
  declare contentId: number;
  declare slug: string;
  declare type: string;
  declare specialTime: string;
  declare startTime: Date;
  declare endTime: Date;
  declare games: CreationOptional<JSON>;
  declare tasks: CreationOptional<JSON>;
  declare metadata: CreationOptional<JSON>;
}

Leaderboard.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  contentId: {
    type: DataTypes.INTEGER,
  },
  name: {
    type: DataTypes.STRING,
  },
  slug: {
    type: DataTypes.STRING,
  },
  type: {
    type: DataTypes.STRING,
  },
  specialTime: {
    type: DataTypes.STRING,
  },
  startTime: {
    type: DataTypes.DATE,
  },
  endTime: {
    type: DataTypes.DATE,
  },
  games: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  tasks: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  indexes: [{unique: true, fields: ['slug']}],
  tableName: 'leaderboard',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default Leaderboard;
