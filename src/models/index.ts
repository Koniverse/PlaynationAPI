import NftCollection from '@src/models/NftCollection';
import NftCampaign from '@src/models/NftCampaign';
import nftMintRequest from '@src/models/NftMintRequest';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import User from '@src/models/User';
import Faucet from '@src/models/Faucet';
import AccountAttribute from '@src/models/AccountAttribute';
import Account from '@src/models/Account';
import Event from '@src/models/Event';
import EventType from '@src/models/EventType';

// NFT Campaign relationship
NftCollection.hasMany(NftCampaign, {
  foreignKey: 'collectionId',
});
NftCampaign.belongsTo(NftCollection, {
  foreignKey: 'collectionId',
});

// NFT Mint Request relationship
NftCampaign.hasMany(nftMintRequest, {
  foreignKey: 'campaignId',
});
nftMintRequest.belongsTo(NftCampaign, {
  foreignKey: 'campaignId',
});

NftCollection.hasMany(nftMintRequest, {
  foreignKey: 'collectionId',
});
nftMintRequest.belongsTo(NftCollection,{
  foreignKey: 'collectionId',
});

User.hasMany(nftMintRequest, {
  foreignKey: 'userId',
});
nftMintRequest.belongsTo(User, {
  foreignKey: 'userId',
});

AccountAttribute.belongsTo(Account, {foreignKey: 'accountId'});
Account.hasOne(AccountAttribute, {foreignKey: 'accountId'});
Account.hasMany(Event, {foreignKey: 'accountId'});

Event.belongsTo(EventType, {foreignKey: 'eventTypeId'});

// Sync all models

SequelizeServiceImpl.addSync((async () => {
  await Account.sync();
  await AccountAttribute.sync();
  await EventType.sync();
  await Event.sync();
  await User.sync();
  await NftCollection.sync();
  await NftCampaign.sync();
  await nftMintRequest.sync();
  await Faucet.sync();
})());

export interface NftCollectionWithCampaigns extends NftCollection {
  campaigns: NftCampaign[];
}

export * from '@src/models/Account';
export * from '@src/models/AccountAttribute';
export * from '@src/models/Event';
export * from '@src/models/EventType';
export * from '@src/models/User';
export * from '@src/models/NftCampaign';
export * from '@src/models/NftCollection';
export * from '@src/models/NftMintRequest';
export * from '@src/models/Faucet';
