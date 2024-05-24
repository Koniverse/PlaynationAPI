import { IReq, IRes } from '@src/routes/types';
import { AirdropCampaignContentCms, AirdropEligibility, AirdropService } from '@src/services/AirdropService';
import { Query } from 'express-serve-static-core';
import { Router } from 'express';

const AirdropRouter = Router();

const airdropService = AirdropService.instance;

const routerMap = {
  listAirdropCampaign: async (req: IReq<Query>, res: IRes) => {
    const response = await airdropService.listAirdropCampaign();
    return res.status(200).json(response);
  },

  sync: async (req: IReq<Query>, res: IRes) => {
    const data = req.body.data as unknown as AirdropCampaignContentCms[];
    const response = await airdropService.syncData(data);
    return res.status(200).json(response);
  },

  createAirdropAndReward: async (req: IReq<Query>, res: IRes) => {
    const data = req.body.data as unknown as AirdropEligibility[];
    const response = await airdropService.createAirdropAndReward(data);
    return res.status(200).json(response);
  },
};
AirdropRouter.post('/sync', routerMap.sync);
AirdropRouter.post('/create-airdrop-reward', routerMap.createAirdropAndReward);
AirdropRouter.get('/list-airdrop-campaign', routerMap.listAirdropCampaign);

export default AirdropRouter;
