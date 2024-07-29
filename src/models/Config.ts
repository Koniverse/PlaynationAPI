import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';

export class Config extends Model<InferAttributes<Config>, InferCreationAttributes<Config>> {
  declare id: CreationOptional<number>; // id on db
  declare name: string;
  declare slug: string;
  declare value: CreationOptional<JSON>;
}

Config.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
  },
  slug: {
    type: DataTypes.STRING,
  },
  value: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  indexes: [{unique: true, fields: ['slug']}],
  tableName: 'config',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default Config;
