import {AddressQuery, CollectionQuery, IQuery, IReq, IRes, SignatureQuery} from '@src/routes/types';
import {Router} from 'express';
import {CheckMintParams, FetchMintParams, MintParams} from '@src/services/type';
import {MintServiceImpl} from '@src/services/MintService';

type FetchMintQuery = CollectionQuery & AddressQuery;
interface SubmitMintQuery extends FetchMintParams, AddressQuery, SignatureQuery {}

const MintRouter= Router();

const routerMap = {
  fetch: async (req: IQuery<FetchMintQuery>, res: IRes) => {
    const {address, rmrkCollectionId} = req.query;
    const rs = await MintServiceImpl.fetch(address, rmrkCollectionId);

    return res.status(200).json(rs);
  },
  check: async (req: IReq<CheckMintParams>, res: IRes) => {
    const rs = await MintServiceImpl.check(req.body);

    return res.status(200).json(rs);
  },
  submit: async (req: IReq<MintParams>, res: IRes) => {
    const mintRs = await MintServiceImpl.mint(req.body);

    return res.status(200).json(mintRs);
  },
};

MintRouter.get('/fetch', routerMap.fetch);
MintRouter.post('/check', routerMap.check);
MintRouter.post('/submit', routerMap.submit);

export default MintRouter;