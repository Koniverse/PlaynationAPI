import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import Account from '@src/models/Account';

export class GiveAwayPoint extends Model<InferAttributes<GiveAwayPoint>, InferCreationAttributes<GiveAwayPoint>> {
  declare id: CreationOptional<number>; // id on db
  declare contentId: CreationOptional<number>;
  declare accountId: number;
  declare point: number;
}

GiveAwayPoint.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  contentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  accountId: {
    type: DataTypes.INTEGER,
    references: {
      model: Account,
      key: 'id',
    },
  },
  point: {
    type: DataTypes.INTEGER,
  },
}, {
  indexes: [],
  tableName: 'giveaway_point',
  sequelize: SequelizeServiceImpl.sequelize,
  createdAt: true,
  updatedAt: true,
});

export default GiveAwayPoint;
