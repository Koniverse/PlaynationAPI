import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {GameContentCms, GameService, newGamePlayParams, SubmitGamePlayParams} from '@src/services/GameService';
import {requireLogin, requireSecret} from '@src/routes/helper';
import * as console from "node:console";

const GameRouter = Router();
type NewGameParams = newGamePlayParams & Query;

const gameService = GameService.instance;

const routerMap = {
  // Sync games
  sync: async (req: IReq<Query>, res: IRes) => {
    const data = req.body.data as unknown as GameContentCms[];
    const response = await GameService.instance.syncData(data);
    return res.status(200).json(response);
  },

  // Get event list
  fetch: async (req: IReq<Query>, res: IRes) => {
    // Get event types
    const eventTypes = await GameService.instance.listGame();

    return res.status(200).json(eventTypes);
  },

  // Create new game session
  newGame: async (req: IReq<NewGameParams>, res: IRes) => {
    const gameId = req.body.gameId;
    const userId = req.user?.id || 0;

    const newGame = await gameService.newGamePlay(userId, gameId);
    return res.status(200).json(newGame);
  },

  // Submit game session
  submitGameplay: async (req: IReq<SubmitGamePlayParams>, res: IRes) => {
    const result = await gameService.submitGameplay(req.body);

    return res.status(200).json(result);
  },

  getHistories: async (req: IReq<Query>, res: IRes) => {
    const result = await gameService.getGameplayHistory(req.user?.id || 0);

    return res.status(200).json(result);
  },

  getLeaderBoard: async (req: IReq<Query>, res: IRes) => {
    const userId = req.user?.id || 0;
    const result = await gameService.getLeaderBoard(userId);
    return res.status(200).json(result);
  },
};

GameRouter.post('/sync', requireSecret, routerMap.sync);
GameRouter.get('/fetch', requireLogin, routerMap.fetch);
GameRouter.get('/histories', requireLogin, routerMap.getHistories);
GameRouter.get('/leader-board', requireLogin, routerMap.getLeaderBoard);

GameRouter.post('/new-game', requireLogin, routerMap.newGame);
GameRouter.post('/submit', requireLogin, routerMap.submitGameplay);

export default GameRouter;
