import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {requireLogin, requireSecret} from '@src/routes/helper';
import {TaskContentCms, TaskService, TaskSubmitParams} from '@src/services/TaskService';

const TaskRouter = Router();

const routerMap = {
  sync: async (req: IReq<Query>, res: IRes) => {
    const data = req.body.data as unknown as TaskContentCms[];
    const response = await TaskService.instance.syncData(data);
    return res.status(200).json(response);
  },
  fetch: async (req: IReq<Query>, res: IRes) => {
    const response = await TaskService.instance.listTask();
    return res.status(200).json(response);
  },
  history: async (req: IReq<Query>, res: IRes) => {
    const userId = req.user?.id || 0;
    const response = await TaskService.instance.listTaskHistory(userId);
    return res.status(200).json(response);
  },
  submit: async (req: IReq<TaskSubmitParams>, res: IRes) => {
    const userId = req.user?.id || 0;
    const response = await TaskService.instance.submit(userId, req.body);
    return res.status(200).json(response);
  },
};

TaskRouter.post('/sync', requireSecret, routerMap.sync);
TaskRouter.get('/history', requireLogin, routerMap.history);
TaskRouter.get('/fetch', requireLogin, routerMap.fetch);
TaskRouter.post('/submit', requireLogin, routerMap.submit);

export default TaskRouter;
