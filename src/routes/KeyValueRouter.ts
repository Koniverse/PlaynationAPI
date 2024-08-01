import { IReq, IRes } from '@src/routes/types';
import { Router } from 'express';
import { Query } from 'express-serve-static-core';
import {requireLogin} from '@src/routes/helper';
import { KeyValueStoreService} from '@src/services/KeyValueStoreService';

const KeyValueRouter = Router();

const routerMap = {

  // Get event list
  fetch: async (req: IReq<Query>, res: IRes) => {
    // Get event types
    const eventTypes = await KeyValueStoreService.instance.getList();

    return res.status(200).json(eventTypes);
  },
};
KeyValueRouter.get('/fetch', requireLogin, routerMap.fetch);

export default KeyValueRouter;
