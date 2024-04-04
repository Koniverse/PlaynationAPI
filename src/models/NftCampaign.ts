import {CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {DuplicateCheckType} from '@src/services/type';

export class NftCampaign extends Model<InferAttributes<NftCampaign>, InferCreationAttributes<NftCampaign>> {
  declare id: CreationOptional<number>; // id on db
  declare collectionId: number; // collectionId on chain
  declare name: string;
  declare description: string;
  declare image: string;
  declare startTime: Date;
  declare endTime: Date;
  declare minted?: CreationOptional<number>;

  // Validation check
  declare validateWhiteList?: boolean;
  declare validateOwner?: boolean;
  declare validateBalance?: boolean;
  declare validateExtrinsic?: boolean;
  declare duplicateCheck?: DuplicateCheckType;
}

NftCampaign.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  collectionId: {
    type: DataTypes.INTEGER,
  },
  name: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.STRING,
  },
  image: {
    type: DataTypes.STRING,
  },
  startTime: {
    type: DataTypes.DATE,
  },
  endTime: {
    type: DataTypes.DATE,
  },
  validateWhiteList: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  validateOwner: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  validateBalance: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  validateExtrinsic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  duplicateCheck: {
    type: DataTypes.STRING,
    defaultValue: DuplicateCheckType.COLLECTION,
  },
}, {
  tableName: 'nft_campaign',
  sequelize: SequelizeServiceImpl.sequelize,
});

// NftCampaign.sync({alter: true});

export default NftCampaign;