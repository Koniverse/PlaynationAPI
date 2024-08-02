import { IReq, IRes } from '@src/routes/types';
import { Router } from 'express';
import {requireLogin} from '@src/routes/helper';
import {LeaderboardNewParams, LeaderBoardService} from '@src/services/LeaderBoardService';
import {Query} from 'express-serve-static-core';

const LeaderboardRouter = Router();

const routerMap = {

  fetch: async (req: IReq<LeaderboardNewParams>, res: IRes) => {
    const accountId = req.user?.id || 0;
    const id = req.body.id;
    const context = req.body.context;
    const data = await LeaderBoardService.instance.fetchData(accountId, id, context);

    return res.status(200).json(data);
  },

  getConfig: async (req: IReq<Query>, res: IRes) => {
    const data = await LeaderBoardService.instance.getConfig();

    return res.status(200).json(data);
  },
};


LeaderboardRouter.post('/fetch', requireLogin, routerMap.fetch);
LeaderboardRouter.get('/get-config', requireLogin, routerMap.getConfig);

export default LeaderboardRouter;
