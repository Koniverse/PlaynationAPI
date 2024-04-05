import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {ITelegramParams} from '@src/models';

type GetAccountQuery = {
  telegramId: number;
} & Query;
type CreateAccountQuery = ITelegramParams & Query;
type LinkWalletQuery = Query;

const AccountRouter = Router();

const routerMap = {
  //Todo: Fetch account details
  get: async (req: IReq<GetAccountQuery>, res: IRes) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.status(200).json({
      success: true,
    });
  },

  //Todo: Create new account from telegram
  create: async (req: IReq<CreateAccountQuery>, res: IRes) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.status(200).json({
      success: true,
    });
  },

  //Todo: Update new account from telegram
  update: async (req: IReq<CreateAccountQuery>, res: IRes) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.status(200).json({
      success: true,
    });
  },

  //Todo: Sync account data and fetch account details
  sync: async (req: IReq<CreateAccountQuery>, res: IRes) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.status(200).json({
      success: true,
    });
  },

  // Todo: Link wallet with account
  linkWallet: async (req: IReq<LinkWalletQuery>, res: IRes) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.status(200).json({
      success: true,
    });
  },
};

AccountRouter.get('/fetch', routerMap.get);
AccountRouter.post('/create', routerMap.create);
AccountRouter.post('/update', routerMap.update);
AccountRouter.get('/sync', routerMap.sync);
AccountRouter.post('/link-wallet', routerMap.linkWallet);

export default AccountRouter;