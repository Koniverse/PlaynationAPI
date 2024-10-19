import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {requireSecret} from '@src/routes/helper';
import {GameEventContentCMS, GameEventService} from '@src/services/GameEventService';

const GameEventRouter = Router();
const gameEventService = GameEventService.instance;

const routerMap = {
  sync: async (req: IReq<{data: GameEventContentCMS[]}>, res: IRes) => {
    const rs = await gameEventService.sync(req.body?.data || []);

    return res.status(200).json(rs);
  },

  fetch: async (req: IReq, res: IRes) => {
    const rs = await gameEventService.list();

    return res.status(200).json(rs);
  }
};

GameEventRouter.post('/sync', requireSecret, routerMap.sync);
GameEventRouter.post('/fetch', requireSecret, routerMap.sync);

export default GameEventRouter;
