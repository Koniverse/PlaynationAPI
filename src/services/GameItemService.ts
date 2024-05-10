import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import Game from '@src/models/Game';
import {
  GameData,
  GameInventoryItem,
  GameInventoryItemStatus,
  GameItem,
  NO_GROUP_KEY,
  Receipt,
  ReceiptEnum,
} from '@src/models';
import EnvVars from '@src/constants/EnvVars';
import { Op } from 'sequelize';
import { getTodayDateRange } from '@src/utils/date';
import { v4 } from 'uuid';
import { QuickGetService } from '@src/services/QuickGetService';

export interface GameItemContentCms {
  id: number;
  slug: string;
  name: string;
  description: string;
  price: number;
  tokenPrice: number;
  gameId: number;
  maxBuy: number;
  maxBuyDaily: number;
  itemGroup: number;
  itemGroupLevel: number;
  effectDuration: number;
}

export interface GameItemSearchParams {
  gameId: number;
}

const quickGet = QuickGetService.instance;

export class GameItemService {
  constructor(private sequelizeService: SequelizeService) {}

  async listItemByGroup(gameId?: number) {
    const items = await quickGet.listGameItem(gameId);
    const result: Record<string, GameItem[]> = {};

    items.forEach((item) => {
      const group = item.itemGroup ?? NO_GROUP_KEY;
      if (!result[group]) {
        result[group] = [];
      }

      result[group].push(item);
    });

    return result;
  }

  async syncData(data: GameItemContentCms[]) {
    const response = {
      success: true,
    };
    for (const item of data) {
      const itemData = { ...item } as unknown as GameItem;
      const existed = await GameItem.findOne({ where: { contentId: item.id } });
      const gameData = await Game.findOne({
        where: { contentId: item.gameId },
      });
      if (!gameData) {
        continue;
      }
      itemData.gameId = gameData.id;
      if (existed) {
        await existed.update(itemData);
      } else {
        itemData.contentId = item.id;
        await GameItem.create(itemData);
      }
    }
    await quickGet.buildGameItemMap();
    return response;
  }

  async buyEnergy(accountId: number) {
    const accountAttribute = await quickGet.requireAccountAttribute(accountId);
    await this.validateMaxDailyPurchases(accountId, ReceiptEnum.BUY_ENERGY);

    if (accountAttribute.point < EnvVars.Game.EnergyPrice) {
      throw new Error('Not enough points');
    }

    if (accountAttribute.energy >= EnvVars.Game.MaxEnergy) {
      throw new Error('You already have max energy');
    }

    try {
      const receipt = await Receipt.create({
        type: ReceiptEnum.BUY_ENERGY,
        userId: accountId,
        point: EnvVars.Game.EnergyPrice,
      });

      await accountAttribute.update({
        point: accountAttribute.point - EnvVars.Game.EnergyPrice,
        energy: accountAttribute.energy + EnvVars.Game.EnergyOneBuy,
      });

      return {
        success: true,
        point: accountAttribute.point,
        energy: accountAttribute.energy,
        receiptId: receipt.id,
        maxEnergy: EnvVars.Game.MaxEnergy,
        energyPrice: EnvVars.Game.EnergyPrice,
        maxBuyEnergy: EnvVars.Game.MaxBuyEnergy,
      };
    } catch (error) {
      throw new Error('Failed to buy energy');
    }
  }

  async buyItem(accountId: number, gameItemId: number, quantity = 1) {
    const account = await quickGet.requireAccount(accountId);
    const gameItem = await quickGet.requireGameItem(gameItemId);
    const game = await quickGet.requireGame(gameItem.gameId);
    const accountAttribute = await quickGet.requireAccountAttribute(account.id);
    const gameData = await quickGet.requireGameData(accountId, game.id);
    if (gameItem.maxBuy && quantity > gameItem.maxBuy) {
      throw new Error(`Cannot buy more than ${gameItem.maxBuy} items at once.`);
    }
    if (gameItem.maxBuyDaily) {
      await this.validateMaxDailyPurchases(account.id, ReceiptEnum.BUY_ITEM, gameItem.maxBuyDaily);
    }
    await this.validateMaxBuyItem(accountId, quantity, gameItem.maxBuy);
    await this.validateMaxDailyPurchases(account.id, ReceiptEnum.BUY_ITEM, gameItem.maxBuyDaily);
    const usePoint = this.calculateTotalCost(gameItem.price, quantity);
    const remainingPoint = this.calculateRemainingPoints(accountAttribute.point, usePoint);
    if (remainingPoint < 0) {
      throw new Error('Not enough points');
    }
    try {
      const gameInventory = await this.handleCreateInventory(accountId, gameItem, gameData.id, game.id);
      const receipt = await Receipt.create({
        type: gameItem.itemGroup === EnvVars.GameItem.ItemLevel ? ReceiptEnum.BUY_LEVEL : ReceiptEnum.BUY_ITEM,
        userId: accountId,
        point: remainingPoint,
        gameId: game.id,
        gameItemId: gameItem.id,
        game_inventory_item_id: gameInventory ? gameInventory.id : 0,
      });
      if (
        gameItem.effectDuration === EnvVars.GameItem.EternalItem &&
        gameItem.itemGroup === EnvVars.GameItem.ItemLevel
      ) {
        await this.handleUpdateLevel(gameItem, gameData);
      }
      await accountAttribute.update({
        point: remainingPoint,
      });
      return {
        success: true,
        point: remainingPoint,
        receiptId: receipt.id,
        inventoryId: gameInventory ? gameInventory.id : 0,
        gameItemId: gameItem.id,
        InventoryQuantity: gameInventory ? gameInventory.id : 0,
        itemGroupLevel: gameItem.itemGroupLevel,
      };
    } catch (error) {
      console.error('Error during purchase: ', error);
      throw error;
    }
  }

  async handleUpdateLevel(gameItem: GameItem, gameData: GameData) {
    if (gameItem.itemGroupLevel === gameData.level + 1) {
      await gameData.update({ level: gameData.level + 1 });
    }
    throw new Error(
      `You can only purchase the next level. Current level: ${gameData.level}, Purchasable level: ${
        gameData.level + 1
      }`,
    );
  }

  async handleCreateInventory(accountId: number, gameItem: GameItem, gameDataId: number, gameId?: number) {
    const inventoryStatus = this.determineInventoryStatus(gameItem);
    const checkGameInventory = await quickGet.requireInventoryGameByGameItemId(accountId, gameItem.id);
    const transactionId = v4();
    let endEffectTime: Date | null = null;

    if (gameItem.effectDuration) {
      endEffectTime = new Date();
      endEffectTime.setSeconds(endEffectTime.getSeconds() + gameItem.effectDuration);
    }
    const gameInventoryData = {
      accountId,
      gameItemId: gameItem.id,
      gameDataId: gameDataId,
      gameId: gameId,
      buyTime: new Date(),
      status: inventoryStatus,
      quantity: 1,
      transactionId,
      endEffectTime,
    } as GameInventoryItem;
    let gameInventory;
    if (checkGameInventory && gameItem.effectDuration === EnvVars.GameItem.DisposableItem) {
      gameInventory = await checkGameInventory.update({
        quantity: checkGameInventory.quantity + 1,
      });
    } else if (!checkGameInventory) {
      gameInventory = await GameInventoryItem.create(gameInventoryData);
    }
    return gameInventory;
  }

  async useInventoryItem(accountId: number, gameItemId: number) {
    const account = await quickGet.requireAccount(accountId);
    const gameInventoryItem = await quickGet.requireInventoryGameByGameItemId(account.id, gameItemId);
    if (!gameInventoryItem) {
      throw new Error('Inventory item not found');
    }
    const gameItem = await quickGet.requireGameItem(gameInventoryItem.gameItemId);

    if (gameItem.effectDuration !== EnvVars.GameItem.DisposableItem) {
      throw new Error('Your item is not a disposable item');
    }
    if (gameInventoryItem.quantity < 1) {
      throw new Error('Your item has expired');
    }
    try {
      await gameInventoryItem.update({
        quantity: gameInventoryItem.quantity - 1,
      });

      return {
        success: true,
        inventoryStatus: gameInventoryItem.status,
        quantity: gameInventoryItem.quantity,
      };
    } catch (error) {
      throw new Error('Failed to use Item');
    }
  }

  private determineInventoryStatus(gameItem: GameItem) {
    if (gameItem.effectDuration === EnvVars.GameItem.EternalItem) {
      return GameInventoryItemStatus.USED;
    }
    return GameInventoryItemStatus.ACTIVE;
  }

  private calculateTotalCost(itemPrice: number, quantity: number): number {
    return itemPrice * quantity;
  }

  private calculateRemainingPoints(currentPoints: number, cost: number): number {
    return currentPoints - cost;
  }

  async validateMaxDailyPurchases(
    accountId: number,
    type: string,
    maxDailyPurchases: number = EnvVars.Game.EnergyBuyLimit,
  ) {
    const { startOfDay, endOfDay } = getTodayDateRange();
    const countReceipt = await Receipt.count({
      where: {
        userId: accountId,
        type: type,
        createdAt: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay,
        },
      },
    });
    if (maxDailyPurchases > 0 && countReceipt >= maxDailyPurchases) {
      throw new Error('You have reached your daily purchase limit. Please try again tomorrow.');
    }
  }

  async validateMaxBuyItem(accountId: number, quantity: number, maxBuy: number) {
    const { startOfDay, endOfDay } = getTodayDateRange();
    const countReceipt = await Receipt.count({
      where: {
        userId: accountId,
        type: ReceiptEnum.BUY_ITEM,
        createdAt: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay,
        },
      },
    });
    if (countReceipt >= maxBuy) {
      throw new Error('You have purchased the maximum number of items');
    }
  }

  async getInventoryLogs(accountId: number, isUsed = false) {
    const queryUsed = isUsed ? "AND i.status = 'used'" : '';
    await quickGet.requireAccount(accountId);
    const sql = `
    SELECT
    gi.id as "gameItemId",
    i.id as "gameInventoryItemId",
    gi.name,
    gi.description,
    gi.price,
    i."buyTime",
    i."usedTime",
    i."endEffectTime",
    i.status
    from game_inventory_item i JOIN game_item gi on i."gameItemId" = gi.id
where i."accountId" = ${accountId} ${queryUsed}
    `;
    const data = await this.sequelizeService.sequelize.query(sql);
    if (data.length > 0) {
      return data[0];
    }
    return [];
  }

  // Singleton
  private static _instance: GameItemService;
  public static get instance() {
    if (!GameItemService._instance) {
      GameItemService._instance = new GameItemService(SequelizeServiceImpl);
    }
    return GameItemService._instance;
  }
}
