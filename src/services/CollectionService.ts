import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import {NftCampaign, NftCollection, NftCollectionWithCampaigns} from '@src/models';
import {Op} from 'sequelize';

export class CollectionService {
  constructor(private sequelizeService: SequelizeService) {

  }

  public async fetchAll(rmrkCollectionId?: string) {
    await this.sequelizeService.syncAll();
    const queryOptions = rmrkCollectionId ? {where: {rmrkCollectionId}} : undefined;
    const collections = await NftCollection.findAll(queryOptions);
    const collectionIds = collections.map((collection) => collection.id);
    const campaigns = await NftCampaign.findAll({where: {collectionId: {[Op.in]: collectionIds}}});

    return collections.map((collection) => {
      return {
        ...collection.toJSON(),
        campaigns: campaigns
          .filter((campaign) => campaign.collectionId === collection.id)
          .map((campaign) => campaign.toJSON()),
      } as NftCollectionWithCampaigns;
    });
  }
}

export const CollectionServiceImpl = new CollectionService(SequelizeServiceImpl);