import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {requireChainSecret} from '@src/routes/helper';
import {ChainListServiceImpl, CreateTransactionParams} from '@src/services/ChainListService';

const ChainRouter = Router();

const routerMap = {

  createTransfer: async (req: IReq<CreateTransactionParams>, res: IRes) => {
    const {address, network, decimal, amount} = req.body;
    const data = await ChainListServiceImpl.createTransfer(address, network, decimal, amount);
    return res.status(200).json(data);
  },

  test: async (req: IReq<CreateTransactionParams>, res: IRes) => {
    const address = '5CSg8BWExTQwLEBS8b2qYzmoG9WAvMWCif3N1h6kFocYsKC7';
    const network = 'alephTest';
    const decimal = 12;
    const amount = 1;
    const data = await ChainListServiceImpl.createTransfer(address, network, decimal, amount);
    return res.status(200).json(data);
  },
};
ChainRouter.post('/create-transfer', requireChainSecret, routerMap.createTransfer);
ChainRouter.get('/test', routerMap.test);

export default ChainRouter;
