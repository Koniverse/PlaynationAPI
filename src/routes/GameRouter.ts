import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {GameService, SubmitEventParams} from '@src/services/GameService';
import {requireLogin} from '@src/routes/helper';
import {CacheService} from "@src/services/CacheService";

const GameRouter = Router();
type JoinEventQuery = {
  slug: string;
} & Query;

const routerMap = {
  // Sync games
  sync: async (req: IReq<Query>, res: IRes) => {
    return res.status(200).json({});
  },

  // Get event list
  fetch: async (req: IReq<Query>, res: IRes) => {
    // Get event types
    const eventTypes = await GameService.instance.listGame();

    return res.status(200).json(eventTypes);
  },

  // Create new game session
  newGame: async (req: IReq<JoinEventQuery>, res: IRes) => {
    // Todo: Create new game session
    return res.status(200).json({});
  },

  // Submit game session
  submitGameplay: async (req: IReq<SubmitEventParams>, res: IRes) => {
    // Todo: Submit game session
    return res.status(200).json({});
  },

  getHistories: async (req: IReq<Query>, res: IRes) => {
    // Todo: Get played games history
    return res.status(200).json({});
  },

  getLeaderBoard: async (req: IReq<Query>, res: IRes) => {
    // Todo: Get leader board
    return res.status(200).json({});
  },
};

GameRouter.get('/sync', requireLogin, routerMap.sync);
GameRouter.get('/fetch', requireLogin, routerMap.fetch);
GameRouter.get('/histories', routerMap.getHistories);
GameRouter.get('/leader-board', routerMap.getLeaderBoard);

GameRouter.post('/new-game', requireLogin, routerMap.newGame);
GameRouter.post('/submit', requireLogin, routerMap.submitGameplay);

export default GameRouter;