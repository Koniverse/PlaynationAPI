import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';

const ShopRouter = Router();

const routerMap = {
  //Todo: Get inventory categories
  getCategories: async (req: IReq<Query>, res: IRes) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.status(200).json({
      success: true,
    });
  },

  //Todo: Get inventories
  getInventories: async (req: IReq<Query>, res: IRes) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.status(200).json({
      success: true,
    });
  },

  //Todo: Get limited inventories
  getLimitedInventories: async (req: IReq<Query>, res: IRes) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.status(200).json({
      success: true,
    });
  },

  //Todo: Get remaining inventories
  getRemainingInventories: async (req: IReq<Query>, res: IRes) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.status(200).json({
      success: true,
    });
  },

  //Todo: Get histories (include purchase, use, trade, etc)
  getHistories: async (req: IReq<Query>, res: IRes) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.status(200).json({
      success: true,
    });
  },

  //Todo: Buy an item
  buy: async (req: IReq<Query>, res: IRes) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.status(200).json({
      success: true,
    });
  },
};

ShopRouter.get('/categories', routerMap.getCategories);
ShopRouter.get('/inventories', routerMap.getInventories);
ShopRouter.get('/limited-inventories', routerMap.getLimitedInventories);
ShopRouter.get('/remaining-inventories', routerMap.getRemainingInventories);
ShopRouter.get('/histories', routerMap.getHistories);
ShopRouter.post('/buy', routerMap.buy);

export default ShopRouter;