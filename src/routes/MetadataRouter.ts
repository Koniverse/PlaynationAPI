import {IQuery, IRes} from '@src/routes/types';
import {Router} from 'express';

const MetadataRouter= Router();

const routerMap = {
  fetch: (_: IQuery<any>, res: IRes) => {
    return res.status(200).json({});
  },
};

MetadataRouter.get('/chain-info', routerMap.fetch);

export default MetadataRouter;