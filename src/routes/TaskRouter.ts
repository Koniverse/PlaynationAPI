import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {requireSecret} from '@src/routes/helper';
import {TaskContentCms, TaskService} from "@src/services/TaskService";

const TaskRouter = Router();

const routerMap = {
  sync: async (req: IReq<Query>, res: IRes) => {
    const data = req.body.data as unknown as TaskContentCms[];
    const response = await TaskService.instance.syncData(data);
    return res.status(200).json(response);
  },
};

TaskRouter.post('/sync', requireSecret, routerMap.sync);

export default TaskRouter;
