import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {requireLogin, requireSecret} from '@src/routes/helper';
import {AchievementClaimParams, AchievementDataContentCms, AchievementService} from '@src/services/AchievementService';

const AchievementRouter = Router();
const achievementService = AchievementService.instance;

const routerMap = {
  sync: async (req: IReq<AchievementDataContentCms>, res: IRes) => {
    const response = await achievementService.syncData(req.body);
    return res.status(200).json(response);
  },
  fetch: async (req: IReq<Query>, res: IRes) => {
    const userId = req.user?.id || 0;
    const response = await achievementService.getAchievementList(userId);
    return res.status(200).json(response);
  },
  claim: async (req: IReq<AchievementClaimParams>, res: IRes) => {
    const userId = req.user?.id || 0;
    const response = await achievementService.claimAchievement(userId, req.body.milestoneId);
    return res.status(200).json(response);
  },
};

AchievementRouter.post('/sync', requireSecret, routerMap.sync);
AchievementRouter.get('/fetch', requireLogin, routerMap.fetch);
AchievementRouter.post('/claim', requireLogin, routerMap.claim);

export default AchievementRouter;
