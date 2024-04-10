import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {GameService, SubmitEventParams} from '@src/services/GameService';
import {requireLogin} from '@src/routes/helper';

const GameRouter = Router();
type JoinEventQuery = {
  slug: string;
} & Query;

const routerMap = {
  //Get event types
  getEventTypes: async (req: IReq<Query>, res: IRes) => {
    //Get event types
    //Todo: Optimize this with caching
    const eventTypes = await GameService.instance.getEventTypes();

    return res.status(200).json(eventTypes);
  },

  //Todo: Get event histories
  getHistories: async (req: IReq<Query>, res: IRes) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.status(200).json({
      success: true,
    });
  },

  // Todo: Get leader board
  getLeaderBoard: async (req: IReq<Query>, res: IRes) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.status(200).json({
      success: true,
    });
  },

  // Join an event
  join: async (req: IReq<JoinEventQuery>, res: IRes) => {
    const address = req.user?.address || '';
    const {slug} = req.body;

    return res.status(200).json({});
  },

  // Submit join session
  submit: async (req: IReq<SubmitEventParams>, res: IRes) => {
    return res.status(200).json({});
  },
};

GameRouter.get('/fetch', requireLogin, routerMap.getEventTypes);
GameRouter.get('/histories', routerMap.getHistories);
GameRouter.get('/leader-board', routerMap.getLeaderBoard);
GameRouter.post('/join', requireLogin, routerMap.join);
GameRouter.post('/submit', requireLogin, routerMap.submit);

export default GameRouter;