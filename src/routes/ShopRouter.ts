import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {requireLogin, requireSecret} from '@src/routes/helper';
import {GameItemContentCms, GameItemService} from '@src/services/GameItemService';

const ShopRouter = Router();
const gameItemService = GameItemService.instance;

const routerMap = {
  sync: async (req: IReq<Query>, res: IRes) => {
    const data = req.body.data as unknown as GameItemContentCms[];
    const response = await gameItemService.syncData(data);
    return res.status(200).json(response);
  },
  getItems: async (req: IReq<Query>, res: IRes) => {
    const response = await gameItemService.listGameItem();
    return res.status(200).json(response);
  },

  getConfigBuyEnergy: async (req: IReq<Query>, res: IRes) => {
    const response = await gameItemService.getConfigBuyEnergy();
    return res.status(200).json(response);
  },
};

ShopRouter.post('/sync', requireSecret, routerMap.sync);
ShopRouter.get('/get-items', requireLogin, routerMap.getItems);

ShopRouter.get('/get-config-buy-energy', routerMap.getConfigBuyEnergy);

export default ShopRouter;
