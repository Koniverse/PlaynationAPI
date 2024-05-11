import SequelizeServiceImpl, { SequelizeService } from '@src/services/SequelizeService';
import Game from '@src/models/Game';
import { GameInventoryItem, GameInventoryItemStatus, GameItem, NO_GROUP_KEY, Receipt, ReceiptEnum } from '@src/models';
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
    const gameItem = await quickGet.requireGameItemID(gameItemId);
    const game = await quickGet.requireGame(gameItem.gameId);
    const accountAttribute = await quickGet.requireAccountAttribute(account.id);
    const gameData = await quickGet.requireGameData(accountId, game.id);

    if (gameItem.maxBuy && quantity > gameItem.maxBuy) {
      throw new Error(`Cannot buy more than ${gameItem.maxBuy} items at once.`);
    }

    if (gameItem.maxBuyDaily) {
      await this.validateMaxDailyPurchases(account.id, ReceiptEnum.BUY_ITEM, gameItem.maxBuyDaily);
    }

    const usePoint = this.calculateTotalCost(gameItem.price, quantity);
    const remainingPoint = this.calculateRemainingPoints(accountAttribute.point, usePoint);

    if (remainingPoint < 0) {
      throw new Error('Not enough points');
    }

    try {
      const transactionId = v4();
      let endEffectTime = null;

      if (gameItem.effectDuration) {
        endEffectTime = new Date();
        endEffectTime.setSeconds(endEffectTime.getSeconds() + gameItem.effectDuration);
      }

      const gameInventoryData = {
        accountId,
        gameItemId: gameItem.id,
        gameDataId: gameData.id,
        gameId: game.id,
        buyTime: new Date(),
        status: this.determineInventoryStatus(gameItem),
        quantity: 1,
        transactionId,
        endEffectTime,
      } as GameInventoryItem;

      const existingInventory = await GameInventoryItem.findOne({
        where: {
          accountId: accountId,
          gameItemId: gameItem.id,
          gameDataId: gameData.id,
        },
      });

      let gameInventory;
      if (!existingInventory) {
        gameInventory = await GameInventoryItem.create(gameInventoryData);
      } else {
        gameInventory = await existingInventory.update({ quantity: existingInventory.quantity + 1 });
      }

      const receipt = await Receipt.create({
        type: gameItem.itemGroup === EnvVars.GameItem.ItemLevel ? ReceiptEnum.BUY_LEVEL : ReceiptEnum.BUY_ITEM,
        userId: accountId,
        point: remainingPoint,
        gameId: game.id,
        gameItemId: gameItem.id,
        game_inventory_item_id: gameInventory.id,
      });
      if (
        gameItem.effectDuration === EnvVars.GameItem.EternalItem &&
        gameItem.itemGroup === EnvVars.GameItem.ItemLevel &&
        gameItem.itemGroupLevel !== gameData.level + 1
      ) {
        throw new Error('Cannot use item before level up');
      }
      if (
        gameItem.effectDuration === EnvVars.GameItem.EternalItem &&
        gameItem.itemGroup === EnvVars.GameItem.ItemLevel &&
        gameItem.itemGroupLevel === gameData.level + 1
      ) {
        await gameData.update({ level: gameData.level + 1 });
      }

      await accountAttribute.update({
        point: remainingPoint,
      });
      return {
        success: true,
        point: remainingPoint,
        receiptId: receipt.id,
        inventoryId: gameInventory.id,
        gameItemId: gameItem.id,
        InventoryQuantity: gameInventory.quantity,
        itemGroupLevel: gameItem.itemGroupLevel,
      };
    } catch (error) {
      throw error;
    }
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
      const newQuantity = gameInventoryItem.quantity - 1;
      await gameInventoryItem.update({
        quantity: newQuantity,
      });
      await quickGet.createGameInventoryLog(
        gameInventoryItem.gameId,
        accountId,
        gameInventoryItem.id,
        gameItem.id,
        newQuantity,
        `Use inventory gameId Item ${gameItem.id} ,  number of uses old ${gameInventoryItem.quantity} remaining ${newQuantity}`,
      );
      return {
        success: true,
        inventoryStatus: gameInventoryItem.status,
        quantity: gameInventoryItem.quantity,
      };
    } catch (error) {
      throw error;
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
