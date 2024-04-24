import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {AccountService, GiveawayPointParams} from '@src/services/AccountService';
import {AccountParams} from '@src/models';
import jwt from 'jsonwebtoken';
import envVars from '@src/constants/EnvVars';
import {requireLogin, requireSecret} from '@src/routes/helper';

type SyncAccountQuery = AccountParams & Query;

const AccountRouter = Router();

const accountService = AccountService.instance;

const routerMap = {
  // Sync account data and fetch account details
  sync: async (req: IReq<SyncAccountQuery>, res: IRes) => {
    try {
      const {referralCode, ...data} = req.body;
      const account = await AccountService.instance.syncAccountData(data, referralCode);
      const accountDetails = await accountService.fetchAccountWithDetails(account.id);
  
      const token = jwt.sign({
        id: account.id,
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
      console.log('Error in sync account', e);
      return res.status(400).json({
        error: 'Invalid login data',
      });
    }
  },

  // Get account details
  getAttribute: async (req: IReq<Query>, res: IRes) => {
    const address = req.user?.address || '';

    const account = await accountService.findByAddress(address);
    const attributes = await accountService.getAccountAttribute(account?.id || 0);

    if (!account || !attributes) {
      return res.status(404).json({
        error: 'Account not found',
      });
    }

    // Mask signature
    account.signature = '___';

    return res.status(200).json({
      account,
      attributes,
    });
  },

  // Get account details
  getReferralLog: async (req: IReq<Query>, res: IRes) => {
    const accountId = req.user?.id || 0;
    const data = await accountService.getReferralLog(accountId);

    return res.status(200).json(data);
  },

  giveAway: async (req: IReq<GiveawayPointParams>, res: IRes) => {
    const params = req.body;
    const data = await accountService.giveAccountPoint(params);
    return res.status(200).json(data);
  },


  syncGiveAway: async (req: IReq<GiveawayPointParams[]>, res: IRes) => {
    // @ts-ignore
    const params = req.body.data as GiveawayPointParams[];
    const data = await accountService.syncGiveAccountPoint(params);
    return res.status(200).json(data);
  },
};

AccountRouter.post('/sync', routerMap.sync);
AccountRouter.get('/get-attribute', requireLogin, routerMap.getAttribute);
AccountRouter.get('/get-rerferal-logs', requireLogin, routerMap.getReferralLog);
AccountRouter.get('/giveaway', requireSecret, routerMap.giveAway);
AccountRouter.post('/sync-giveaway', requireSecret, routerMap.syncGiveAway);

export default AccountRouter;
