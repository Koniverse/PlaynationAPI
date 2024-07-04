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
    const {address, network, decimal, amount} = req.body;
    const data = await ChainListServiceImpl.createTransfer(address, network, decimal, amount);
    return res.status(200).json(data);
  },

  createPolkadotAssetHubAirdrop: async (req: IReq<CreatePAAirdropTransactionParams>, res: IRes) => {
    const {assetId, address, network, decimal, amount} = req.body;
    const data = await ChainListServiceImpl.createPolkadotAssetAirdrop(address, network, assetId, decimal, amount);
    return res.status(200).json(data);
  },
};
ChainRouter.post('/create-transfer', requireChainSecret, routerMap.createTransfer);
ChainRouter.post('/create-pa-airdrop', requireChainSecret, routerMap.createPolkadotAssetHubAirdrop);

export default ChainRouter;
