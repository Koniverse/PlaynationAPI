import {IQuery, IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {requireSecret} from '@src/routes/helper';
import {KeyValueStoreService} from '@src/services/KeyValueStoreService';
import {AppMetadata} from '@src/services/type';

const MetadataRouter= Router();
const kvStore = KeyValueStoreService.instance;

const routerMap = {
  syncGeneralMetadata: async (req: IReq<{data: AppMetadata}>, res: IRes) => {
    await kvStore.syncMetadata(req.body.data);

    return res.status(200).json({success: true});
  },

  fetchGeneralMetadata: async (req: IQuery<any>, res: IRes) => {
    const data = await kvStore.getMetadata();

    return res.status(200).json(data);
  },
};

MetadataRouter.post('/sync', requireSecret, routerMap.syncGeneralMetadata);
MetadataRouter.get('/fetch', routerMap.fetchGeneralMetadata);

export default MetadataRouter;