import { IReq, IRes } from '@src/routes/types';
import { AirdropCampaignContentCms, AirdropRecordInsertData, AirdropService } from '@src/services/AirdropService';
import { Query } from 'express-serve-static-core';
import { Router } from 'express';

const AirdropRouter = Router();
const airdropService = AirdropService.instance;

const routerMap = {
  insertAirdropCampaign: async (req: IReq<AirdropRecordInsertData>, res: IRes) => {
    const accountId = req.user?.id || 0;
    const { typeQuery, startDate, endDate, gameId, limit } = req.body;
    const response = await airdropService.insertAirdropCampaign(
      accountId,
      gameId,
      startDate,
      endDate,
      limit,
      typeQuery,
    );
    return res.status(200).json(response);
  },

  listAirdropCampaign: async (req: IReq<Query>, res: IRes) => {
    const response = await airdropService.listAirdropCampaign();
    return res.status(200).json(response);
  },

  sync: async (req: IReq<Query>, res: IRes) => {
    const data = req.body.data as unknown as AirdropCampaignContentCms[];
    const response = await airdropService.syncData(data);
    return res.status(200).json(response);
  },
};
AirdropRouter.post('/sync', routerMap.sync);
AirdropRouter.get('/list-airdrop-campaign', routerMap.listAirdropCampaign);
AirdropRouter.post('/insert-airdrop-record', routerMap.insertAirdropCampaign);

export default AirdropRouter;
