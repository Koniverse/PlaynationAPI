import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {requireLogin, requireSecret} from '@src/routes/helper';
import {AchievementDataContentCms, AchievementService} from '@src/services/AchievementService';

const AchievementRouter = Router();
const achievementService = AchievementService.instance;

const routerMap = {
  sync: async (req: IReq<AchievementDataContentCms>, res: IRes) => {
    // @ts-ignore
    const response = await achievementService.syncData(req.body.data as unknown as AchievementDataContentCms);
    return res.status(200).json(response);
  },
  fetch: async (req: IReq<Query>, res: IRes) => {
    return res.status(200).json({success: true});
  },
  claim: async (req: IReq<Query>, res: IRes) => {
    return res.status(200).json({success: true});
  },
};

AchievementRouter.post('/sync', requireSecret, routerMap.sync);
AchievementRouter.get('/fetch', requireLogin, routerMap.fetch);
AchievementRouter.post('/claim', requireLogin, routerMap.claim);

export default AchievementRouter;
