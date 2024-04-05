import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {AccountService} from '@src/services/AccountService';
import {AccountParams} from '@src/models';

type SyncAccountQuery = AccountParams & Query;

const AccountRouter = Router();

const routerMap = {
  // Sync account data and fetch account details
  sync: async (req: IReq<SyncAccountQuery>, res: IRes) => {
    const data = req.body;
    const account = await AccountService.instance.syncAccountData(data);
    const accountDetails = await AccountService.instance.fetchAccountWithDetails(account.id);

    req.session.address = account.address;
    req.session.time = account.sessionTime;
    return res.status(200).json(accountDetails);
  },

  // //Todo: Create new account from telegram
  // create: async (req: IReq<CreateAccountQuery>, res: IRes) => {
  //   await new Promise((resolve) => setTimeout(resolve, 1000));
  //   return res.status(200).json({
  //     success: true,
  //   });
  // },

  // //Todo: Update new account from telegram
  // update: async (req: IReq<CreateAccountQuery>, res: IRes) => {
  //   await new Promise((resolve) => setTimeout(resolve, 1000));
  //   return res.status(200).json({
  //     success: true,
  //   });
  // },

  // // Todo: Link wallet with account
  // linkWallet: async (req: IReq<LinkWalletQuery>, res: IRes) => {
  //   await new Promise((resolve) => setTimeout(resolve, 1000));
  //   return res.status(200).json({
  //     success: true,
  //   });
  // },
};

AccountRouter.post('/sync', routerMap.sync);

export default AccountRouter;