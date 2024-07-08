import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {requireChainSecret} from '@src/routes/helper';
import {
  ChainListServiceImpl,
  CreatePAAirdropTransactionParams,
  CreateTransactionParams,
} from '@src/services/ChainListService';

const ChainRouter = Router();

const routerMap = {

  createTransfer: async (req: IReq<CreateTransactionParams>, res: IRes) => {
    const {address, network, decimal, amount, token_slug} = req.body;
    const data = await ChainListServiceImpl.createTransfer(address, network, decimal, amount, token_slug);
    return res.status(200).json(data);
  },
};
ChainRouter.post('/create-transfer', requireChainSecret, routerMap.createTransfer);

export default ChainRouter;
