import { IReq, IRes } from '@src/routes/types';
import { Router } from 'express';
import { Query } from 'express-serve-static-core';
import {requireLogin, requireSecret} from '@src/routes/helper';
import {ConfigContentCms, ConfigService} from '@src/services/ConfigService';

const ConfigRouter = Router();

const routerMap = {
  sync: async (req: IReq<Query>, res: IRes) => {
    const data = req.body.data as unknown as ConfigContentCms[];
    const response = await ConfigService.instance.syncData(data);
    return res.status(200).json(response);
  },

  // Get event list
  fetch: async (req: IReq<Query>, res: IRes) => {
    // Get event types
    const eventTypes = await ConfigService.instance.getList();

    return res.status(200).json(eventTypes);
  },
};

ConfigRouter.post('/sync', requireSecret, routerMap.sync);
ConfigRouter.get('/fetch', requireLogin, routerMap.fetch);

export default ConfigRouter;
