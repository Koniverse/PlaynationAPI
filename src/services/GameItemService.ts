import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import Game from '@src/models/Game';
import {AccountAttribute, GameInventoryItem, GameInventoryItemStatus, GameItem, NO_GROUP_KEY, Receipt, ReceiptEnum} from '@src/models';
import {AccountService} from '@src/services/AccountService';
import {v4} from 'uuid';
import {validateSignature} from '@src/utils';
import {QuickGetService} from '@src/services/QuickGetService';
import EnvVars from '@src/constants/EnvVars';
import { Op } from 'sequelize';


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

  async generateDefaultData(gameId: number) {
    const existed = await GameItem.findOne({where: {contentId: 1}});
    if (existed) {
      return existed;
    }

    return await GameItem.create({
      contentId: 1,
      name: 'Game item',
      description: 'Default Game item',
      effectDuration: 200,
      gameId: gameId,
      itemGroup: 'LEVEL',
      itemGroupLevel: 1,
      maxBuy: 0,
      price: 300,
      tokenPrice: 0,
      slug: 'level1',
    });
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


  async validate(accountId: number, transactionId: string, signature: string, isValidateSignature = true) {
    const account = await accountService.findById(accountId);
    if (!account) {
      throw new Error('Account not found');
    }
    const gameInventoryItem = await GameInventoryItem.findOne({where: {transactionId}});
    if (!gameInventoryItem) {
      throw new Error('Game inventory item not found');
    }
    if (gameInventoryItem.accountId !== accountId) {
      throw new Error('Invalid account');
    }
    if (gameInventoryItem.status !== GameInventoryItemStatus.INACTIVE) {
      throw new Error('Item already active');
    }
    const validSignature = validateSignature(account.address, transactionId , signature);

    if (!validSignature && isValidateSignature) {
      throw new Error('Invalid signature ' + transactionId);
    }
    await gameInventoryItem.update({
      status: GameInventoryItemStatus.ACTIVE,
      signature,
    });
    return {
      success: true,
    };
  }
  private getSlug(level: number) {
    return `level${level}`;
  }

  async buyEnergy(accountId: number) {
    const accountAttribute = await accountService.getAccountAttribute(accountId, false);
  
    if (!accountAttribute) {
      throw new Error('Account not found');
    }
  
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); 
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999); 
  
    const countReceipt = await Receipt.count({
      where: {
        userId: accountId,
        createdAt: {
          [Op.gte]: todayStart, 
          [Op.lte]: todayEnd  
        },
      }
    });
  
    if (countReceipt >= EnvVars.Game.EnergyBuyLimit) {
      throw new Error('You already buy max energy in day, pls go back tomorrow');
    }
  
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
    const gameData = await quickGet.requireGameData(account.id, game.id);
    const accountAttribute = await AccountService.instance.getAccountAttribute(accountId, false);

    // Validate user point
    const usePoint = gameItem.price * quantity;
    const remainingPoint = accountAttribute.point - usePoint;
    if (remainingPoint < 0) {
      throw new Error('Not enough point');
    }

    // Create transaction
    const transactionId = v4();
    let endEffectTime = null;
    if (gameItem.effectDuration){
      endEffectTime = new Date();
      endEffectTime.setSeconds(endEffectTime.getSeconds() + gameItem.effectDuration);
    }

    const gameInventoryData = {
      accountId,
      gameItemId: gameItem.id,
      gameDataId: gameData.id,
      gameId: game.id,
      buyTime: new Date(),
      status: GameInventoryItemStatus.INACTIVE,
      transactionId,
      endEffectTime,
    } as GameInventoryItem;

    await accountAttribute.update({
      point: remainingPoint,
    });

    await GameInventoryItem.create(gameInventoryData);

    return {
      success: true,
      transactionId,
    };
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
