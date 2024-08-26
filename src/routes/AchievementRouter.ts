import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {requireLogin, requireSecret} from '@src/routes/helper';
import {AchievementClaimParams, AchievementDataContentCms, AchievementService} from '@src/services/AchievementService';
import {LeaderBoardServiceV2} from "@src/services/LeaderBoardServiceV2";
import {LeaderboardType} from "@src/services/leaderboards/BaseLeaderBoard";

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
  test: async (req: IReq<AchievementClaimParams>, res: IRes) => {
    const accountIds = [11, 2,1 ,5];
    const headers = req.headers;
    const userIP = headers['cf-connecting-ip'] || '0.0.0.0';
    const country = headers['cf-ipcountry'] || 'NA_';
    console.log('userIP', userIP, country, req.ip);
    const data = await LeaderBoardServiceV2.instance.getLeaderBoardAccountData(accountIds, {
        type: LeaderboardType.ALL_NPS,
    });
    return res.status(200).json(data);
  },
};

AchievementRouter.post('/sync', requireSecret, routerMap.sync);
AchievementRouter.get('/fetch', requireLogin, routerMap.fetch);
AchievementRouter.post('/claim', requireLogin, routerMap.claim);
AchievementRouter.get('/test',  routerMap.test);

export default AchievementRouter;
