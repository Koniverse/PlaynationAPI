import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {ZealyService} from '@src/services/ZealyService';
import {WebhookZealy} from '@src/types';

const ZealyRouter = Router();

const zealyService = ZealyService.instance;

const routerMap = {
  
  webhookZealy: async (req: IReq<WebhookZealy>, res: IRes) => {
    const body = req.body;
    await zealyService.webhookZealyAsync(body);
    return res.status(200).json({});
  },

  test: async (req: IReq<Query>, res: IRes) => {
    // const data = await checkQuest();
    return res.status(200).json({});
  },
};
ZealyRouter.post('/webhook', routerMap.webhookZealy);
ZealyRouter.get('/test', routerMap.test);

export default ZealyRouter;
