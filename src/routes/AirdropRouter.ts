import { IReq, IRes } from '@src/routes/types';
import { AirdropCampaignContentCms, AirdropService } from '@src/services/AirdropService';
import { Query } from 'express-serve-static-core';
import { Router } from 'express';

const AirdropRouter = Router();

const routerMap = {
  // Sync airdrop
  sync: async (req: IReq<Query>, res: IRes) => {
    const data = req.body.data as unknown as AirdropCampaignContentCms[];
    const response = await AirdropService.instance.syncData(data);
    return res.status(200).json(response);
  },
};
AirdropRouter.post('/sync', routerMap.sync);

export default AirdropRouter;
