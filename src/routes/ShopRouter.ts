import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {requireLogin, requireSecret} from '@src/routes/helper';
import {
  GameItemContentCms,
  GameItemService,
  GameItemParams,
  GameItemValidateParams, GameItemSearchParams
} from '@src/services/GameItemService';

const ShopRouter = Router();

const routerMap = {
  sync: async (req: IReq<Query>, res: IRes) => {
    const data = req.body.data as unknown as GameItemContentCms[];
    const response = await GameItemService.instance.syncData(data);
    return res.status(200).json(response);
  },
  getItems: async (req: IReq<GameItemSearchParams>, res: IRes) => {
    const response = await GameItemService.instance.listGameItem(req.body);
    return res.status(200).json(response);
  },

  submit: async (req: IReq<GameItemParams>, res: IRes) => {
    const userId = req.user?.id || 0;
    const response = await GameItemService.instance.submit(userId, req.body);
    return res.status(200).json(response);
  },

  validate: async (req: IReq<GameItemValidateParams>, res: IRes) => {
    const userId = req.user?.id || 0;
    const response = await GameItemService.instance.validate(userId, req.body);
    return res.status(200).json(response);
  },

  getInventoryLogs: async (req: IReq<Query>, res: IRes) => {
    const userId = req.user?.id || 0;
    const response = await GameItemService.instance.getInventoryLogs(userId);
    return res.status(200).json(response);
  },
};

ShopRouter.post('/sync', requireSecret, routerMap.sync);
ShopRouter.post('/get-items', requireLogin, routerMap.getItems);
ShopRouter.post('/submit', requireLogin, routerMap.submit);
ShopRouter.post('/buy-item-validate', requireLogin, routerMap.validate);
ShopRouter.get('/buy-item-log', requireLogin, routerMap.getInventoryLogs);

export default ShopRouter;
