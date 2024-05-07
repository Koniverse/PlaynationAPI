import {Account, AccountAttribute, Game, GameData, GameItem, Receipt, ReceiptEnum, Task} from '@src/models';
import {Op} from 'sequelize';
import EnvVars from '@src/constants/EnvVars';

export class QuickGetService {
  private gameMap: Record<string, Game> | undefined;
  private gameItemMap: Record<string, GameItem> | undefined;


  // API for Game
  async buildGameMap() {
    const data = await Game.findAll();
    const gameMap: Record<string, Game> = {};
    data.forEach((game) => {
      gameMap[game.id.toString()] = game;
    });

    this.gameMap = gameMap;
    return gameMap;
  }

  async listGame() {
    const gameMap = !!this.gameMap ? this.gameMap : await this.buildGameMap();

    return Object.values(gameMap);
  }

  async findGame(gameId: number) {
    const gameMap = !!this.gameMap ? this.gameMap : await this.buildGameMap();

    return gameMap[gameId.toString()];
  }

  async requireGame(gameId: number) {
    const game = await this.findGame(gameId);
    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }

    return game;
  }

  // API for GameItem
  async buildGameItemMap() {
    const data = await GameItem.findAll();
    const gameItemMap: Record<string, GameItem> = {};
    data.forEach((item) => {
      gameItemMap[item.id.toString()] = item;
    });

    this.gameItemMap = gameItemMap;
    return gameItemMap;
  }

  async findGameItem(id: number) {
    const gameItemMap = !!this.gameItemMap ? this.gameItemMap : await this.buildGameItemMap();
    return gameItemMap[id.toString()];
  }

  async listGameItem(gameId?: number) {
    const gameItemMap = !!this.gameItemMap ? this.gameItemMap : await this.buildGameItemMap();
    if (!gameId) {
      return Object.values(gameItemMap);
    }
    return Object.values(gameItemMap).filter((item) => item.gameId === gameId);
  }

  async requireGameItem(gameItemId: number) {
    const gameItem = await this.findGameItem(gameItemId);
    if (!gameItem) {
      throw new Error(`GameItem not found: ${gameItemId}`);
    }

    return gameItem;
  }

  async requireAccount(accountId: number) {
    const account = await Account.findByPk(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    return account;
  }

  async requireAccountAttribute(accountId: number) {
    const accountAttribute = await AccountAttribute.findOne({where: {accountId}});
    if (!accountAttribute) {
      throw new Error('AccountAttribute not found');
    }

    return accountAttribute;
  }

  async requireGameData(accountId: number, gameId: number) {
    const gameData = await GameData.findOne({where: {accountId, gameId}});

    if (!gameData) {
      throw new Error('GameData not found');
    }

    return gameData;
  }

  async requireTask(taskId: number) {
    const task = await Task.findByPk(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }

  calculateTotalCost(itemPrice: number, quantity: number): number {
    return itemPrice * quantity;
  }

  calculateRemainingPoints(currentPoints: number, cost: number): number {
    return currentPoints - cost;
  }
  async validateMaxDailyPurchases(accountId: number, type:string, maxDailyPurchases: number = EnvVars.Game.EnergyBuyLimit ) {
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));
    const countReceipt = await Receipt.count({
      where: {
        userId: accountId,
        type: type,
        createdAt: {
          [Op.gte]: todayStart,
          [Op.lte]: todayEnd
        }
      }
    });

    if (countReceipt >= EnvVars.Game.EnergyBuyLimit) {
      throw new Error('You have reached your daily purchase limit. Please try again tomorrow.');
    }
  }

  // Singleton
  private static _instance: QuickGetService;
  static get instance(): QuickGetService {
    if (!QuickGetService._instance) {
      QuickGetService._instance = new QuickGetService();
    }

    return QuickGetService._instance;
  }
}
