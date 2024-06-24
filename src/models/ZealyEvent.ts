import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';

export class ZealyEvent extends Model<InferAttributes<ZealyEvent>, InferCreationAttributes<ZealyEvent>> {
  declare id: CreationOptional<number>; // id on db

  declare zealyUserId: string;
  declare claimId: string;
  declare questId: string;
  declare webhookType: string;
  declare status: string;
  declare content: JSON;
  declare value: string;
}

ZealyEvent.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  zealyUserId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  claimId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  questId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  webhookType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  value: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  content: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  
}, {
  indexes: [],
  tableName: 'zealy_events',
  sequelize: SequelizeServiceImpl.sequelize,
});

export default ZealyEvent;
