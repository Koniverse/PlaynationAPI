import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';

const EventRouter = Router();

const routerMap = {
  //Todo: Run event types
  getEventTypes: async (req: IReq<Query>, res: IRes) => {
    //Todo: implement cache
    //Todo: implement get event types
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.status(200).json({
      success: true,
    });
  },

  //Todo: get event histories
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

  // Todo: join an event
  join: async (req: IReq<Query>, res: IRes) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.status(200).json({
      success: true,
    });
  },

  // Todo: subject join session
  submit: async (req: IReq<Query>, res: IRes) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.status(200).json({
      success: true,
    });
  },
};

EventRouter.get('/event-types', routerMap.getEventTypes);
EventRouter.get('/histories', routerMap.getHistories);
EventRouter.get('/leader-board', routerMap.getLeaderBoard);
EventRouter.post('/join', routerMap.join);
EventRouter.post('/submit', routerMap.submit);

export default EventRouter;