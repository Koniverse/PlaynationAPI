import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {AccountService, syncAccountInfo} from '@src/services/AccountService';

type GetAccountQuery = {
  telegramId: number;
} & Query;
type SyncAccountQuery = syncAccountInfo & Query;

const AccountRouter = Router();

const routerMap = {
  get: async (req: IReq<GetAccountQuery>, res: IRes) => {
    // Todo: Validate with signature
    const telegramId = req.query.telegramId;

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        message: 'Missing telegramId',
      });
    } else if (typeof telegramId !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Invalid telegramId',
      });
    }

    const accountService = AccountService.instance;
    const account = await accountService.findByTelegramId(telegramId);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    const accountDetails = await accountService.fetchAccountWithDetails(account.id);

    return res.status(200).json(accountDetails);
  },

  // Sync account data and fetch account details
  sync: async (req: IReq<SyncAccountQuery>, res: IRes) => {
    // Todo: Validate with signature
    const data = req.body;
    const account = await AccountService.instance.syncAccountData(data);
    const accountDetails = await AccountService.instance.fetchAccountWithDetails(account.id);
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

AccountRouter.post('/get', routerMap.get);
AccountRouter.post('/sync', routerMap.sync);

export default AccountRouter;