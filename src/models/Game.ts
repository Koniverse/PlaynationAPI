import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';

export enum GameType {
  CASUAL = 'casual',
  FARMING = 'farming',
}

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
  declare gameType: GameType;

  declare startTime: CreationOptional<Date>;
  declare endTime: CreationOptional<Date>;

  declare maxPointPerGame: CreationOptional<number>;
  declare pointConversionRate: CreationOptional<number>;
  declare rankDefinition: CreationOptional<string>;
  declare leaderboards: CreationOptional<JSON>;
}

Game.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  gameType: {
    type: DataTypes.ENUM(GameType.CASUAL, GameType.FARMING),
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
  
      
  leaderboards: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  pointConversionRate: {
    type: DataTypes.FLOAT,
    defaultValue: 1,
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
