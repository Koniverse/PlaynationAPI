import { IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {getRandomCodeParams} from '@src/services/type';
import {UserServiceImpl} from '@src/services/UserService';

type LoginQuery = getRandomCodeParams & Query;

const CollectionRouter = Router();

const routerMap = {
  getRandomCode: async (req: IReq<LoginQuery>, res: IRes) => {
    console.log(req.body);
    const {address} = req.body;
    const {id, randomCode} = await UserServiceImpl.requestUserWithRandomCode(address);
    return res.status(200).json({
      id, randomCode,
    });
  },
};

CollectionRouter.post('/get-code', routerMap.getRandomCode);

export default CollectionRouter;