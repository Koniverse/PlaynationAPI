import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';

export class Game extends Model<InferAttributes<Game>, InferCreationAttributes<Game>> {
  declare id: CreationOptional<number>; // id on db
  declare contentId: number;
  declare slug: string;
  declare name: string;
  declare description: string;
  declare url: string;
  declare icon: string;
  declare banner: string;
  declare maxEnergy: number;
  declare energyPerGame: number;
  declare active: boolean; // Todo: change to field on CMS

  declare startTime: CreationOptional<Date>;
  declare endTime: CreationOptional<Date>;

  declare maxPointPerGame: CreationOptional<number>;
  declare rankDefinition: CreationOptional<string>;
}

Game.init({
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
  },
  name: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.STRING,
  },
  url: {
    type: DataTypes.STRING,
  },
  icon: {
    type: DataTypes.STRING,
  },
  banner: {
    type: DataTypes.STRING,
  },
  maxEnergy: {
    type: DataTypes.INTEGER,
  },
  energyPerGame: {
    type: DataTypes.INTEGER,
  },
  maxPointPerGame: {
    type: DataTypes.INTEGER,
  },
  rankDefinition: {
    type: DataTypes.TEXT,
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
  active: {
    type: DataTypes.BOOLEAN,
  },
}, {
  indexes: [{unique: true, fields: ['slug']}, {unique: true, fields: ['contentId']}],
  tableName: 'game',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default Game;
