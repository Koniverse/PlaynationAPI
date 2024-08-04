import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';

export class KeyValueStore extends Model<InferAttributes<KeyValueStore>, InferCreationAttributes<KeyValueStore>> {
  declare id: CreationOptional<number>; // id on db
  declare key: string;
  declare value: CreationOptional<JSON>;
}

KeyValueStore.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  key: {
    type: DataTypes.STRING,
  },
  value: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  indexes: [{unique: true, fields: ['key']}],
  tableName: 'key_value_store',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default KeyValueStore;
