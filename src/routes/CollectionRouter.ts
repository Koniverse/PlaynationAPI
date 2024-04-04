import {CollectionQuery, IQuery, IRes} from '@src/routes/types';
import {Router} from 'express';
import {CollectionServiceImpl} from '@src/services/CollectionService';

type FetchCollectionQuery = CollectionQuery;

const CollectionRouter = Router();

const routerMap = {
  fetch: async ({query: {rmrkCollectionId}}: IQuery<FetchCollectionQuery>, res: IRes) => {
    const rs = await CollectionServiceImpl.fetchAll(rmrkCollectionId);
    return res.status(200).json(rs);
  },
};

CollectionRouter.get('/fetch', routerMap.fetch);

export default CollectionRouter;