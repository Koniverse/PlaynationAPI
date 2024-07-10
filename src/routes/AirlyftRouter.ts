import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {AirlyftService, AirlyftSyncParams} from '@src/services/AirlyftService';
import {AirlyftEventWebhook, Task} from '@src/models';

const AirlyftRouter = Router();

const airlyftService = AirlyftService.instance;

const routerMap = {

  test: async (req: IReq<Query>, res: IRes) => {
    const taskSync = await Task.findOne({
      where: {
        airlyftType: 'telegram-sync',
      },
    });
    if (!taskSync) {
      return res.status(404).json({error: 'task not found'});
    }
    const eventId = taskSync.airlyftEventId;
    const taskIds = [taskSync.airlyftId];

    const data = await airlyftService.eventSubmissions(eventId, taskIds);
    return res.status(200).json(data);
  },
  syncAccount: async (req: IReq<AirlyftSyncParams>, res: IRes) => {
    console.log('data', req.body);
    const userId = req.body.userId;
    const data = await airlyftService.syncAccount(userId);
    return res.status(200).json(data);
  },

  webhook: async (req: IReq<AirlyftEventWebhook>, res: IRes) => {
    console.log('webhook data', req.body);
    await airlyftService.syncWebhook(req.body);
    return res.status(200).json({});
  },
};
AirlyftRouter.post('/sync-account', routerMap.syncAccount);
AirlyftRouter.post('/webhook', routerMap.webhook);
AirlyftRouter.get('/test', routerMap.test);

export default AirlyftRouter;
