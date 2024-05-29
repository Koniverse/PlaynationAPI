import { IReq, IRes } from '@src/routes/types';
import { AirdropService } from '@src/services/AirdropService';
import { AirdropCampaignInterface } from '@src/models/AirdropCampaign';
import { AirdropEligibilityInterface } from '@src/models/AirdropEligibility';

import { Query } from 'express-serve-static-core';
import { Router } from 'express';
import { requireLogin, requireSecret } from '@src/routes/helper';

const AirdropRouter = Router();

const airdropService = AirdropService.instance;

interface AirdropRecordAndDistribute {
  campaign_id: number;
}

const routerMap = {
  listAirdropCampaign: async (req: IReq<Query>, res: IRes) => {
    const response = await airdropService.listAirdropCampaign();
    return res.status(200).json(response);
  },

  syncAirdropCampaign: async (req: IReq<Query>, res: IRes) => {
    const data = req.body.data as unknown as AirdropCampaignInterface[];
    const response = await airdropService.syncDataCampaign(data);
    return res.status(200).json(response);
  },

  syncDataEligibility: async (req: IReq<Query>, res: IRes) => {
    const data = req.body.data as unknown as AirdropEligibilityInterface[];
    const response = await airdropService.syncDataEligibility(data);
    return res.status(200).json(response);
  },
  generateAirdropRecordAndDistribute: async (req: IReq<AirdropRecordAndDistribute>, res: IRes) => {
    const campaign_id = req.body.campaign_id;
    const response = await airdropService.generateAirdropRecordAndDistribute(campaign_id);
    return res.status(200).json(response);
  },
  checkEligibility: async (req: IReq<AirdropRecordAndDistribute>, res: IRes) => {
    const userId = req.user?.id || 0;
    const campaign_id = req.body.campaign_id;
    const response = await airdropService.checkEligibility(userId, campaign_id);
    return res.status(200).json(response);
  },
};
AirdropRouter.post('/sync-airdrop-campaign', routerMap.syncAirdropCampaign);
AirdropRouter.post('/sync-airdrop-eligibility', routerMap.syncDataEligibility);
AirdropRouter.post('/generate-airdrop-record', requireSecret, routerMap.generateAirdropRecordAndDistribute);
AirdropRouter.get('/list-airdrop-campaign', requireLogin, routerMap.listAirdropCampaign);
AirdropRouter.post('/check-eligibility', requireLogin, routerMap.checkEligibility);

export default AirdropRouter;