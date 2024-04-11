import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {requireSecret} from '@src/routes/helper';
import {GameItemContentCms, GameItemService} from '@src/services/GameItemService';

const ShopRouter = Router();

const routerMap = {
  sync: async (req: IReq<Query>, res: IRes) => {
    const data = req.body.data as unknown as GameItemContentCms[];
    const response = await GameItemService.instance.syncData(data);
    return res.status(200).json(response);
  },
};

ShopRouter.post('/sync', requireSecret, routerMap.sync);

export default ShopRouter;
