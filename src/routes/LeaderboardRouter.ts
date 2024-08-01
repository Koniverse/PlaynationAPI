import { IReq, IRes } from '@src/routes/types';
import { Router } from 'express';
import { Query } from 'express-serve-static-core';
import {requireLogin, requireSecret} from '@src/routes/helper';
import {LeaderboardNewParams, LeaderBoardService} from '@src/services/LeaderBoardService';
import {LeaderboardContentCms} from '@src/types';

const LeaderboardRouter = Router();

const routerMap = {
  sync: async (req: IReq<Query>, res: IRes) => {
    const data = req.body.data as unknown as LeaderboardContentCms;
    const response = await LeaderBoardService.instance.syncData(data);
    return res.status(200).json({response});
  },

  // Get event list
  fetch: async (req: IReq<LeaderboardNewParams>, res: IRes) => {
    const accountId = req.user?.id || 0;
    const id = req.body.id;
    const context = req.body.context;
    const data = await LeaderBoardService.instance.fetchData(accountId, id, context);

    return res.status(200).json(data);
  },
};

LeaderboardRouter.post('/sync', requireSecret, routerMap.sync);
LeaderboardRouter.post('/fetch', requireLogin, routerMap.fetch);

export default LeaderboardRouter;
