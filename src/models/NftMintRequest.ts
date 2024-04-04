// **** Variables **** //

// **** Types **** //

import {
  BelongsToGetAssociationMixin,
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {NftMintRequestStatus} from '@src/types';
import NftCollection from '@src/models/NftCollection';

export class NftMintRequest extends Model<InferAttributes<NftMintRequest>, InferCreationAttributes<NftMintRequest>>{
  declare id: CreationOptional<number>;
  declare campaignId: number;
  declare collectionId: number;
  declare userId: number;
  declare address: string;
  declare signature: string;
  declare status: NftMintRequestStatus;
  declare balanceData: CreationOptional<string>;
  declare mintCategory: string;

  // Minting data
  declare mintDate: CreationOptional<Date>;
  declare rmrkNftId: CreationOptional<string>;
  declare nftName: CreationOptional<string>;
  declare nftImage: CreationOptional<string>;
  declare recipient: CreationOptional<string>;
  declare extrinsicHash?: CreationOptional<string>;
  declare blockNumber?: CreationOptional<number>;

  declare metadata?: CreationOptional<string>;
  declare additionalData?: CreationOptional<string>;

  // Associations methods
  declare getCollection: BelongsToGetAssociationMixin<NftCollection>;
}

NftMintRequest.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  campaignId: {
    type: DataTypes.INTEGER,
  },
  collectionId: {
    type: DataTypes.INTEGER,
  },
  userId: {
    type: DataTypes.INTEGER,
  },
  address: {
    type: DataTypes.STRING,
  },
  signature: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.STRING,
  },
  balanceData: {
    type: DataTypes.TEXT,
  },
  extrinsicHash: {
    type: DataTypes.STRING,
  },
  mintCategory: {
    type: DataTypes.STRING,
    defaultValue: '__default',
  },
  mintDate: {
    type: DataTypes.DATE,
  },
  rmrkNftId: {
    type: DataTypes.STRING,
  },
  nftName: {
    type: DataTypes.STRING,
  },
  nftImage: {
    type: DataTypes.STRING,
  },
  recipient: {
    type: DataTypes.STRING,
  },
  blockNumber: {
    type: DataTypes.INTEGER,
  },
  metadata: {
    type: DataTypes.STRING,
  },
  additionalData: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'nft_mint_request',
  sequelize: SequelizeServiceImpl.sequelize,
});

// NftMintRequest.sync({alter: true});

export default NftMintRequest;