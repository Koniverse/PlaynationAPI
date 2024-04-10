import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {requireSecret} from '@src/routes/helper';

const TaskRouter = Router();

const routerMap = {
  sync: async (req: IReq<Query>, res: IRes) => {
    //Get event types
    return res.status(200).json({});
  },
};

TaskRouter.get('/sync', requireSecret, routerMap.sync);

export default TaskRouter;