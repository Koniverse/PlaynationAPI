import { IReq, IRes } from '@src/routes/types';
import { Router } from 'express';
import {requireLogin} from '@src/routes/helper';
import {LeaderboardParams} from '@src/services/LeaderBoardService';
import {Query} from 'express-serve-static-core';
import {LeaderBoardServiceV2} from '@src/services/LeaderBoardServiceV2';

const LeaderboardRouter = Router();

const routerMap = {

  fetch: async (req: IReq<LeaderboardParams>, res: IRes) => {
    const accountId = req.user?.id || 0;
    const id = req.body.id;
    const context = req.body.context;
    const limit = req.body.limit ?? 100;
    const data = await LeaderBoardServiceV2.instance.fetchData(accountId, id, context, limit);

    return res.status(200).json(data);
  },

  getConfig: async (req: IReq<Query>, res: IRes) => {
    const data = await LeaderBoardServiceV2.instance.getConfig();

    return res.status(200).json(data);
  },
};


LeaderboardRouter.post('/fetch', requireLogin, routerMap.fetch);
LeaderboardRouter.get('/get-config', requireLogin, routerMap.getConfig);

export default LeaderboardRouter;
