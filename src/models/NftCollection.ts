import {
  CreationOptional,
  DataTypes,
  HasManyCountAssociationsMixin,
  HasManyGetAssociationsMixin,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import {NetworkType, RequirementType} from '@src/types';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import NftCampaign from '@src/models/NftCampaign';

export class NftCollection extends Model<InferAttributes<NftCollection>, InferCreationAttributes<NftCollection>> {
  declare id: CreationOptional<number>; // id on db
  declare rmrkCollectionId: string; // collectionId on rmrk
  declare name: string;
  declare description: string;
  declare image: string;
  declare network: string;
  declare networkType: NetworkType;
  declare networkName: string;
  declare nftMetadata: string; // collectionId on rmrk
  declare minted: CreationOptional<number>;

  declare getNftCampaigns: HasManyGetAssociationsMixin<NftCampaign[]>;
  declare countNftMintRequests: HasManyCountAssociationsMixin;
}

NftCollection.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  rmrkCollectionId: {
    type: DataTypes.STRING,
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
  network: {
    type: DataTypes.STRING,
  },
  networkType: {
    type: DataTypes.STRING,
  },
  networkName: {
    type: DataTypes.STRING,
  },
  nftMetadata: {
    type: DataTypes.TEXT,
  },
  minted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'nft_collection',
  sequelize: SequelizeServiceImpl.sequelize,
});

// NftCollection.sync({alter: true});


export default NftCollection;