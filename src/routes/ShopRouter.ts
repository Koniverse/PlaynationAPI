import { IReq, IRes } from '@src/routes/types';
import { Router } from 'express';
import { Query } from 'express-serve-static-core';
import { requireLogin, requireSecret } from '@src/routes/helper';
import { GameItemContentCms, GameItemSearchParams, GameItemService } from '@src/services/GameItemService';

const ShopRouter = Router();

interface BuyParams {
  signature?: string;
  transactionId?: string;
}

export type BuyEnergyParams = BuyParams;

export interface BuyGameItemParams extends BuyParams {
  gameItemId: number;
  quantity?: number;
}

export interface UseItemParams extends BuyParams {
  gameItemId: number;
}

type GetItemLogsParams = {
  isUsed?: boolean;
} & Query;

const gameItemService = GameItemService.instance;

const routerMap = {
  // Sync items from CMS
  sync: async (req: IReq<Query>, res: IRes) => {
    const data = req.body.data as unknown as GameItemContentCms[];
    const response = await gameItemService.syncData(data);
    return res.status(200).json(response);
  },

  // Get list of items
  listItems: async (req: IReq<GameItemSearchParams>, res: IRes) => {
    const { gameId } = req.body;

    const response = await gameItemService.listItemByGroup(gameId);

    return res.status(200).json(response);
  },

  // Buy Energy
  buyEnergy: async (req: IReq<BuyEnergyParams>, res: IRes) => {
    const userId = req.user?.id || 0;
    const response = await gameItemService.buyEnergy(userId);
    return res.status(200).json(response);
  },
  getConfigBuyEnergy: async (req: IReq<Query>, res: IRes) => {
    const response = await gameItemService.getConfigBuyEnergy();
    return res.status(200).json(response);
  },
  // Buy items
  buyItem: async (req: IReq<BuyGameItemParams>, res: IRes) => {
    const userId = req.user?.id || 0;
    const { gameItemId, quantity } = req.body;
    const response = await gameItemService.buyItem(userId, gameItemId, quantity);
    return res.status(200).json(response);
  },

  // Use Item
  useInventoryItem: async (req: IReq<UseItemParams>, res: IRes) => {
    const userId = req.user?.id || 0;
    const { gameItemId } = req.body;
    const response = await gameItemService.useInventoryItem(userId, gameItemId);
    return res.status(200).json(response);
  },

  // Get inventories
  getInventoryLogs: async (req: IReq<GetItemLogsParams>, res: IRes) => {
    const userId = req.user?.id || 0;
    const response = await gameItemService.getInventoryLogs(userId);
    return res.status(200).json(response);
  },

  getInventoryByAccount: async (req: IReq<GetItemLogsParams>, res: IRes) => {
    const userId = req.user?.id || 0;
    const response = await gameItemService.getInventoryByAccount(userId);
    return res.status(200).json(response);
  },
};

ShopRouter.post('/sync', requireSecret, routerMap.sync);

// Get list of items
ShopRouter.post('/list-items', requireLogin, routerMap.listItems);

// Buy items
ShopRouter.post('/buy-energy', requireLogin, routerMap.buyEnergy);
ShopRouter.get('/get-config-buy-energy', routerMap.getConfigBuyEnergy);
ShopRouter.post('/buy-item', requireLogin, routerMap.buyItem);
ShopRouter.post('/use-inventory-item', requireLogin, routerMap.useInventoryItem);

// Get inventories logs
ShopRouter.get('/get-inventory-logs', requireLogin, routerMap.getInventoryLogs);

// Get Inventory list by account
ShopRouter.get('/get-inventory', requireLogin, routerMap.getInventoryByAccount);

export default ShopRouter;
