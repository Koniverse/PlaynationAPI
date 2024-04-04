import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {FaucetServiceImpl} from '@src/services/FaucetService';
import {AddressParams, SubmitFaucetParams} from '@src/services/type';

const FaucetRouter= Router();

const routerMap = {
  checkFaucet: async (req: IReq<AddressParams>, res: IRes) => {
    const {address} = req.body;
    const data = await FaucetServiceImpl.checkFaucet(address);
    return res.status(200).json(data);
  },
  submitFaucet: async (req: IReq<SubmitFaucetParams>, res: IRes) => {
    const data = await FaucetServiceImpl.submitFaucet(req.body);
    return res.status(200).json(data);
  },
};

FaucetRouter.post('/check-faucet', routerMap.checkFaucet);
FaucetRouter.post('/submit-faucet', routerMap.submitFaucet);

export default FaucetRouter;
