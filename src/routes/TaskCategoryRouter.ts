import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {requireLogin, requireSecret} from '@src/routes/helper';
import {TaskCategoryContentCms, TaskCategoryService} from '@src/services/TaskCategoryService';

const TaskCategoryRouter = Router();
const taskCategoryService = TaskCategoryService.instance;

const routerMap = {
  sync: async (req: IReq<Query>, res: IRes) => {
    const data = req.body.data as unknown as TaskCategoryContentCms[];
    const response = await taskCategoryService.syncData(data);
    return res.status(200).json(response);
  },
  fetch: async (req: IReq<Query>, res: IRes) => {
    const response = await taskCategoryService.list();
    return res.status(200).json(response);
  },
};

TaskCategoryRouter.post('/sync', requireSecret, routerMap.sync);
TaskCategoryRouter.get('/fetch', requireLogin, routerMap.fetch);

export default TaskCategoryRouter;
