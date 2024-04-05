import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {AccountService} from '@src/services/AccountService';
import {AccountParams} from '@src/models';
import jwt from 'jsonwebtoken';
import envVars from '@src/constants/EnvVars';
import {requireLogin} from '@src/routes/helper';

type SyncAccountQuery = AccountParams & Query;

const AccountRouter = Router();

const routerMap = {
  // Sync account data and fetch account details
  sync: async (req: IReq<SyncAccountQuery>, res: IRes) => {
    try {
      const data = req.body;
      const account = await AccountService.instance.syncAccountData(data);
      const accountDetails = await AccountService.instance.fetchAccountWithDetails(account.id);
  
      const token = jwt.sign({
        address: account.address,
        loginTime: account.sessionTime,
      },
      envVars.Jwt.Secret,
      {expiresIn: '1d'},
      );

      return res.status(200).json({
        ...accountDetails,
        token,
      });
    } catch (e) {
      return res.status(400).json({
        error: 'Invalid login data',
      });
    }
  },

  // Get account details
  getAttribute: async (req: IReq<Query>, res: IRes) => {
    const address = req.user?.address || '';

    const account = await AccountService.instance.findByAddress(address);
    const attributes = await account?.getAccountAttribute();

    if (!account || !attributes) {
      return res.status(404).json({
        error: 'Account not found',
      });
    }

    account.signature = '___';

    return res.status(200).json({
      account,
      attributes,
    });
  },

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
AccountRouter.get('/get-attribute', requireLogin, routerMap.getAttribute);

export default AccountRouter;