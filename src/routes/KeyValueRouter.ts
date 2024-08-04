import { IReq, IRes } from '@src/routes/types';
import { Router } from 'express';
import { Query } from 'express-serve-static-core';
import {requireSecret} from '@src/routes/helper';
import { KeyValueStoreService} from '@src/services/KeyValueStoreService';
import {LeaderboardContentCms} from '@src/types';

const KeyValueRouter = Router();

const routerMap = {
  
  sync: async (req: IReq<Query>, res: IRes) => {
    const data = req.body.data as unknown as LeaderboardContentCms;
    const response = await KeyValueStoreService.instance.syncData(data);
    return res.status(200).json({response});
  },
};
KeyValueRouter.post('/sync', requireSecret, routerMap.sync);

export default KeyValueRouter;
