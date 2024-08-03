import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {AccountCheckParams, AccountService} from '@src/services/AccountService';
import {GameService, MultiGamePlayCheckParams} from '@src/services/GameService';

type CheckUserByTelegramQuery = AccountCheckParams & Query;
type CheckGamePlayByTelegramQuery = MultiGamePlayCheckParams & Query;

const PublicRouter = Router();
const accountService = AccountService.instance;
const gameService = GameService.instance;

const routerMap = {
  // Sync account data and fetch account details
  checkPointByTelegramId: async (req: IReq<CheckUserByTelegramQuery>, res: IRes) => {
    try {
      const publicData = await accountService.checkPointByTelegramId(req.body);

      return res.status(200).json({
        ...publicData,
      });
    } catch (e) {
      console.log('Error in check account', e);

      return res.status(404).json({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        error: e.message,
      });
    }
  },
  // Sync account data and fetch account details
  checkGamePlayByTelegramId: async (req: IReq<CheckGamePlayByTelegramQuery>, res: IRes) => {
    try {
      const publicData = await gameService.checkGamePlayByTelegramId(req.body);

      return res.status(200).json({
        ...publicData,
      });
    } catch (e) {
      console.log('Error in check account', e);

      return res.status(404).json({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        error: e.message,
      });
    }
  },
};

PublicRouter.post('/telegram/check-point', routerMap.checkPointByTelegramId);
PublicRouter.post('/telegram/check-gameplay', routerMap.checkGamePlayByTelegramId);

export default PublicRouter;
