import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import Game from '@src/models/Game';

export class Task extends Model<InferAttributes<Task>, InferCreationAttributes<Task>> {
  declare id: CreationOptional<number>; // id on db
  declare gameId: CreationOptional<number>;
  declare contentId: number;
  declare slug: string;
  declare name: string;
  declare description: string;
  declare icon: string;
  declare url: string;
  declare pointReward: number;
  declare itemReward: CreationOptional<number>;
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
}, {
  indexes: [{unique: true, fields: ['slug']}],
  tableName: 'task',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default Task;
