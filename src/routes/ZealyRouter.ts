import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {AccountService} from '@src/services/AccountService';
import * as console from 'node:console';
import {ZealyActionRoutes, ZealyService} from '@src/services/ZealyService';
import {WebhookZealy} from '@src/types';

const ZealyRouter = Router();

const accountService = AccountService.instance;
const zealyService = ZealyService.instance;

const routerMap = {
  
  webhookZealy: async (req: IReq<WebhookZealy>, res: IRes) => {
    const body = req.body;
    console.log('webhookZealy', body);
    await zealyService.webhookZealyAsync(body);
    return res.status(200).json({});
  },

  test: async (req: IReq<Query>, res: IRes) => {

      const dataReview = {
        status: 'fail',
        claimedQuestIds: ['b8849ed5-ed86-4020-85e5-fb03630b6260'],
        comment: 'Auto validate',
      };
      console.log('dataReview', dataReview);
      await zealyService.addAction(ZealyActionRoutes.ClaimedQuestsReview, 'v1', 'POST', dataReview);
    return res.status(200).json({});
  },
};
ZealyRouter.post('/webhook', routerMap.webhookZealy);
ZealyRouter.get('/test', routerMap.test);

export default ZealyRouter;
