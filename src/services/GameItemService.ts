import SequelizeServiceImpl, {SequelizeService} from '@src/services/SequelizeService';
import Game from '@src/models/Game';
import {GameData, GameInventoryItem, GameInventoryItemStatus, GameItem} from '@src/models';
import {AccountService} from '@src/services/AccountService';
import {v4} from 'uuid';
import {validateSignature} from '@src/utils';


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


export interface GameItemParams {
  gameItemId: number,
}
export interface GameItemSearchParams {
  level: number,
}
export interface GameItemValidateParams{
  signature: string;
  transactionId: string;
}

const accountService = AccountService.instance;

export class GameItemService {
  private gameItemMap: Record<string, GameItem> | undefined;
  constructor(private sequelizeService: SequelizeService) {

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
    await this.buildMap();
    return response;
  }


  async buildMap() {
    const data = await GameItem.findAll();
    const dataMap: Record<string, GameItem> = {};
    data.forEach((item) => {
      dataMap[item.id.toString()] = item;
    });

    this.gameItemMap = dataMap;
    return dataMap;
  }

  async findGameItem(id: number) {
    const gameItemMap = !!this.gameItemMap ? this.gameItemMap : await this.buildMap();
    return gameItemMap[id.toString()];
  }

  async listGameItem(data: GameItemSearchParams) {
    const dataMap = !!this.gameItemMap ? this.gameItemMap : await this.buildMap();
    const {level} = data;
    if (!level) {
      return Object.values(dataMap);
    }
    return Object.values(dataMap).filter((item) => !item.slug || item.slug === `level${level}`);
  }

  async validate(accountId: number, data: GameItemValidateParams) {
    const account = await accountService.findById(accountId);
    if (!account) {
      throw new Error('Account not found');
    }
    const {signature, transactionId} = data;
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

    if (!validSignature) {
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
  async submit(accountId: number, data: GameItemParams) {
    const account = await accountService.findById(accountId);
    if (!account) {
      throw new Error('Account not found');
    }
    const gameItem = await this.findGameItem(data.gameItemId);
    if (!gameItem) {
      throw new Error('Game item not found');
    }
    const game = await Game.findOne({where: {id: gameItem.gameId}});
    if (!game) {
      throw new Error('Game not found');
    }
    
    const gameData = await GameData.findOne({where: {
      gameId: gameItem.gameId,
      accountId: accountId,
    }});
    if (!gameData) {
      throw new Error('Game data not found');
    }
    const accountAttribute = await AccountService.instance.getAccountAttribute(accountId, false);
    if (!accountAttribute) {
      throw new Error('Account attribute not found');
    }
    if (accountAttribute.point < gameItem.price) {
      throw new Error('Not enough point');
    }
    const newPoint = accountAttribute.point - gameItem.price;
    let transactionId = v4();
    let endEffectTime = null;
    if (gameItem.effectDuration){
      endEffectTime = new Date();
      endEffectTime.setSeconds(endEffectTime.getSeconds() + gameItem.effectDuration);
    }
    // eslint-disable-next-line no-constant-condition
    while (true){
      const existed = await GameInventoryItem.findOne({where: {transactionId}});
      if (!existed){
        break;
      }
      transactionId = v4();
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
      point: newPoint,
    });
    await GameInventoryItem.create(gameInventoryData);
    return {
      success: true,
      transactionId,
    };
  }

  async getInventoryLogs(accountId: number, isUsed = false) {
    const queryUsed = isUsed ? 'AND i.status = \'used\'' : '';
    const account = await accountService.findById(accountId);
    if (!account) {
      throw new Error('Account not found');
    }
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
