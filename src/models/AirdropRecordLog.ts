import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import { AirdropRecord } from './AirdropRecord';

export class AirdropRecordLog extends Model<
  InferAttributes<AirdropRecordLog>,
  InferCreationAttributes<AirdropRecordLog>
> {
  declare id: CreationOptional<number>;
  declare airdrop_record_id: CreationOptional<number>;
  declare action: string;
  declare created_at: CreationOptional<Date>;
}

AirdropRecordLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    airdrop_record_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: AirdropRecord,
        key: 'id',
      },
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'airdrop_record_log',
    sequelize: SequelizeServiceImpl.sequelize,
  },
);
