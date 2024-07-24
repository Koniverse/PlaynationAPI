import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {AirlyftService, AirlyftSyncParams, AirlyftEventWebhook} from '@src/services/AirlyftService';
import {Task} from '@src/models';
import {requireLogin} from "@src/routes/helper";

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
    const address = req.body.address;
    const data = await airlyftService.syncAccountByAddress(userId, address);
    return res.status(200).json(data);
  },

  webhook: async (req: IReq<AirlyftEventWebhook>, res: IRes) => {
    console.log('webhook data', req.body);
    await airlyftService.syncWebhook(req.body);
    return res.status(200).json({});
  },

  getToken: async (req: IReq<Query>, res: IRes) => {
    const account_id = req.user?.id || 0;
    const data = await airlyftService.getAccountToken(account_id);
    return res.status(200).json(data);
  },
};
AirlyftRouter.post('/sync-account', routerMap.syncAccount);
AirlyftRouter.post('/webhook', routerMap.webhook);
AirlyftRouter.get('/get-token', requireLogin, routerMap.getToken);
AirlyftRouter.get('/test', routerMap.test);

export default AirlyftRouter;
