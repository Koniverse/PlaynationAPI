import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {requireLogin, requireSecret} from '@src/routes/helper';
import {ChainListServiceImpl, CreateTransactionParams} from "@src/services/ChainListService";

const ChainRouter = Router();

const routerMap = {

  createTransaction: async (req: IReq<CreateTransactionParams>, res: IRes) => {
    const {address, network, decimal, amount} = req.body;
    const data = await ChainListServiceImpl.createTransaction(address, network, decimal, amount);
    return res.status(200).json(data);
  },
};
// ChainRouter.post('/sync-giveaway', requireSecret, routerMap.syncGiveAway);
ChainRouter.post('/create-transaction', requireSecret, routerMap.createTransaction);

export default ChainRouter;
