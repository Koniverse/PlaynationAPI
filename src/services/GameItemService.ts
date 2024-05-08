import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import Game from '@src/models/Game';
import {GameInventoryItem, GameInventoryItemStatus, GameItem, NO_GROUP_KEY, Receipt, ReceiptEnum} from '@src/models';
import {AccountService} from '@src/services/AccountService';
import {v4} from 'uuid';
import {QuickGetService} from '@src/services/QuickGetService';
import EnvVars from '@src/constants/EnvVars';


export interface GameItemContentCms {
    id: number,
    name: string,
    description: string,
    tokenPrice: number,
    slug: string,
    price: number,
    effectDuration: number,
    gameId: number,
    maxBuy: string,
    itemGroup: number,
    itemGroupLevel: number,
}

export interface GameItemSearchParams {
  gameId: number,
}

const accountService = AccountService.instance;
const quickGet = QuickGetService.instance;

export class GameItemService {
  constructor(private sequelizeService: SequelizeService) {

  }
  async listItemByGroup(gameId: number) {
    const items = await quickGet.listGameItem(gameId);
    const result:Record<string, GameItem[]> = {};

    items.forEach((item) => {
      const group = item.itemGroup ?? NO_GROUP_KEY;
      if (!result[group]) {
        result[group] = [];
      }

      result[item.itemGroup].push(item);
    });

    return result;
  }

  async syncData(data: GameItemContentCms[]) {
    const response = {
      success: true,
    };
    for (const item of data) {
      const itemData = {...item} as unknown as GameItem;
      const existed = await GameItem.findOne({where: {contentId: item.id}});
      const gameData = await Game.findOne({where: {contentId: item.gameId}});
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
    await quickGet.validateMaxDailyPurchases(accountId, ReceiptEnum.BUY_ENERGY);

    if (accountAttribute.point < EnvVars.Game.EnergyPrice) {
      throw new Error('Not enough points');
    }
  
    if (accountAttribute.energy === EnvVars.Game.MaxEnergy) {
      throw new Error('You already have max energy');
    }
  
    try {
      const receipt = await Receipt.create({
        type: ReceiptEnum.BUY_ENERGY,
        userId: accountId,
        point: EnvVars.Game.EnergyPrice
      });
  
      await accountAttribute.update({
        point: accountAttribute.point - EnvVars.Game.EnergyPrice,
        energy: accountAttribute.energy + EnvVars.Game.EnergyOneBuy,
      });
  
      return {
        success: true,
        point: accountAttribute.point,
        energy: accountAttribute.energy,
        receiptId: receipt.id
      }
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

    const usePoint = quickGet.calculateTotalCost(gameItem.price, quantity);
    const remainingPoint = quickGet.calculateRemainingPoints(accountAttribute.point, usePoint);

    if (remainingPoint < 0) {
      throw new Error('Not enough points');
    }

    if (quantity > gameItem.maxBuy) {
      throw new Error('Please purchase smaller quantities ' + gameItem.maxBuy);
    }
    await quickGet.validateMaxDailyPurchases(account.id, ReceiptEnum.BUY_ITEM, gameItem.maxBuyDaily);

    try {
      let inventory_status: string = '';
      const transactionId = v4();
      let endEffectTime = null;
      if (gameItem.effectDuration) {
        endEffectTime = new Date();
        endEffectTime.setSeconds(endEffectTime.getSeconds() + gameItem.effectDuration);
      }

      if (gameItem.effectDuration === EnvVars.GameItem.EternalItem) {
        inventory_status = GameInventoryItemStatus.ACTIVE;
        if (gameItem.itemGroup === EnvVars.GameItem.ItemLevel) {
          await gameData.update({
            level: gameData.level++,
          });
        }
      }
      if (gameItem.effectDuration === EnvVars.GameItem.DisposableItem) {
        inventory_status = GameInventoryItemStatus.INACTIVE;
      }
      const gameInventoryData = {
        accountId,
        gameItemId: gameItem.id,
        gameDataId: gameData.id,
        gameId: game.id,
        buyTime: new Date(),
        status: inventory_status,
        transactionId,
        endEffectTime,
      } as GameInventoryItem;
      const gameInventory: GameInventoryItem = await GameInventoryItem.create(gameInventoryData);
      const receipt = await Receipt.create({
        type: gameItem.itemGroup === EnvVars.GameItem.ItemLevel ? ReceiptEnum.BUY_LEVEL : ReceiptEnum.BUY_ITEM,
        userId: accountId,
        point: remainingPoint,
        gameId: game.id,
        gameItemId: gameItem.id,
        game_inventory_item_id: gameInventory.id,
      });

      await accountAttribute.update({
        point: remainingPoint,
      });

      return {
        success: true,
        point: remainingPoint,
        receiptId: receipt.id,
        inventoryId: gameInventory.id,
        itemGroupLevel: gameItem.itemGroupLevel,
      };

    } catch (error) {
      throw new Error('Failed to buy Item');
    }
  }

  async  useInventoryItem(accountId: number,gameItemId:number, gameId: number) {
    const account = await quickGet.requireAccount(accountId);
    const gameItem = await quickGet.requireGameItem(gameItemId);
    const gameInventoryItem = await quickGet.requireInventoryGame(account.id,gameItemId);

    if(gameItem.effectDuration !== EnvVars.GameItem.DisposableItem) {
      throw new Error('Your item is not a disposable item');
    }
    try {
      await gameInventoryItem.update({
        status: GameInventoryItemStatus.ACTIVE,
      })
    } catch (error) {
      throw new Error('Failed to use Item');
    }
  }

  async getInventoryLogs(accountId: number, isUsed = false) {
    const queryUsed = isUsed ? 'AND i.status = \'used\'' : '';
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
