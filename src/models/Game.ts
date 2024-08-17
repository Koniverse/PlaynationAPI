import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {VersionInfo} from '@src/services/type';

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
  declare leaderboard_groups: CreationOptional<JSON>;

  declare restrictedAccess: CreationOptional<JSON>;
  declare restrictedAccessText: CreationOptional<string>;
  declare metadata: CreationOptional<VersionInfo>;
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
  leaderboard_groups: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  restrictedAccess: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  restrictedAccessText: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  pointConversionRate: {
    type: DataTypes.FLOAT,
    defaultValue: 1,
  },
  active: {
    type: DataTypes.BOOLEAN,
  },
  metadata: {
    type: DataTypes.JSONB,
  },
}, {
  indexes: [{unique: true, fields: ['slug']}, {unique: true, fields: ['contentId']}],
  tableName: 'game',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default Game;
