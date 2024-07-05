import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {AirlyftService, AirlyftSyncParams} from '@src/services/AirlyftService';

const AirlyftRouter = Router();

const airlyftService = AirlyftService.instance;
const routerMap = {

  test: async (req: IReq<Query>, res: IRes) => {
    const eventId = '551f5de8-30ce-4bb7-b5aa-dc7d4e42172f';
    const taskIds = ['bc75a6d3-d68d-407a-b53c-a0d1622ac171'];

    const data = await airlyftService.eventSubmissions(eventId, taskIds);
    return res.status(200).json(data);
  },
  syncAccount: async (req: IReq<AirlyftSyncParams>, res: IRes) => {
    console.log('data', req.body);
    const userId = req.body.userId;
    const data = await airlyftService.syncAccount(userId);
    return res.status(200).json(data);
  },
};
AirlyftRouter.post('/sync-account', routerMap.syncAccount);
AirlyftRouter.get('/test', routerMap.test);

export default AirlyftRouter;
