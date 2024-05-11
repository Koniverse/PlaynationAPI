import {
  Account,
  AccountAttribute,
  Game,
  GameData,
  GameInventoryItem,
  GameInventoryLog,
  GameItem,
  Task,
} from '@src/models';

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

  async requireGameItemID(gameItemId: number) {
    const gameItem = await this.findGameItem(gameItemId);
    if (!gameItem) {
      throw new Error(`GameItem not found: ${gameItemId}`);
    }
    return gameItem;
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
    const accountAttribute = await AccountAttribute.findOne({
      where: { accountId },
    });
    if (!accountAttribute) {
      throw new Error('AccountAttribute not found');
    }

    return accountAttribute;
  }

  async requireGameData(accountId: number, gameId: number) {
    let gameData = await GameData.findOne({ where: { accountId, gameId } });
    if (!gameData) {
      gameData = await GameData.create({ accountId, gameId, point: 0, level: 1, rank: 1, dayLimit: 0 });
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

  async requireInventoryGameByGameItemId(accountId: number, gameItemId: number) {
    return await GameInventoryItem.findOne({
      where: { accountId, gameItemId },
    });
  }

  async createGameInventoryLog(
    gameId: number,
    accountId: number,
    gameDataId: number,
    gameItemId: number,
    quantity: number,
    note: string,
  ) {
    return await GameInventoryLog.create({
      gameId,
      accountId,
      gameDataId,
      gameItemId,
      quantity,
      note,
    });
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
