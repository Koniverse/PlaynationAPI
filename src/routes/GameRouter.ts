import { IReq, IRes } from '@src/routes/types';
import { Router } from 'express';
import { Query } from 'express-serve-static-core';
import {
  GameContentCms,
  GameInventoryItemParams,
  GameService, GetLastStateParams,
  newGamePlayParams,
  SubmitGamePlayParams, SubmitGamePlayStateParams,
} from '@src/services/GameService';
import { requireLogin, requireSecret } from '@src/routes/helper';
import { GameItemService } from '@src/services/GameItemService';
import { LeaderboardParams, LeaderBoardService } from '@src/services/LeaderBoardService';

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

  // Submit game session
  submitState: async (req: IReq<SubmitGamePlayStateParams>, res: IRes) => {
    const {gamePlayId, stateData} = req.body;
    const result = await gameService.submitGamePlayState(gamePlayId, stateData);

    return res.status(200).json(result);
  },
  // Submit game session
  getLastState: async (req: IReq<GetLastStateParams>, res: IRes) => {
    const userId = req.user?.id || 0;
    const {gameId} = req.body;
    const result = await gameService.getLastState(userId, gameId);

    return res.status(200).json(result);
  },

  getHistories: async (req: IReq<Query>, res: IRes) => {
    const result = await gameService.getGameplayHistory(req.user?.id || 0);

    return res.status(200).json(result);
  },

  getLeaderBoard: async (req: IReq<LeaderboardParams>, res: IRes) => {
    const userId = req.user?.id || 0;
    const { type, startDate, endDate, gameId, limit } = req.body;
    const result = await LeaderBoardService.instance.getTotalLeaderboard(
      userId,
      gameId,
      startDate,
      endDate,
      limit,
      type,
    );
    return res.status(200).json(result);
  },

  usedGameItem: async (req: IReq<GameInventoryItemParams>, res: IRes) => {
    const userId = req.user?.id || 0;
    const { gameInventoryItemId } = req.body;
    const result = await gameService.useGameInventoryItem(userId, gameInventoryItemId);
    return res.status(200).json(result);
  },

  getInventoryLogs: async (req: IReq<Query>, res: IRes) => {
    const userId = req.user?.id || 0;
    const response = await GameItemService.instance.getInventoryLogs(userId, true);
    return res.status(200).json(response);
  },
};

GameRouter.post('/sync', requireSecret, routerMap.sync);
GameRouter.get('/fetch', requireLogin, routerMap.fetch);
GameRouter.get('/histories', requireLogin, routerMap.getHistories);
GameRouter.post('/leader-board', requireLogin, routerMap.getLeaderBoard);

GameRouter.post('/new-game', requireLogin, routerMap.newGame);
GameRouter.post('/submit', requireLogin, routerMap.submitGameplay);
GameRouter.post('/get-last-state', requireLogin, routerMap.getLastState);
GameRouter.post('/submit-state', requireLogin, routerMap.submitState);

GameRouter.post('/use-item', requireLogin, routerMap.usedGameItem);
GameRouter.get('/used-item-log', requireLogin, routerMap.getInventoryLogs);

export default GameRouter;
