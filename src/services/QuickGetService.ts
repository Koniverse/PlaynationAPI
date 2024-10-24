import {
  Account,
  AccountAttribute,
  Game,
  GameData, GameEvent,
  GameInventoryItem,
  GameInventoryItemStatus,
  GameItem,
  GamePlay,
  Task,
} from '@src/models';
import {RecordVersionInfo} from '@src/services/type';
import {KeyValueStoreService} from '@src/services/KeyValueStoreService';

const kvService = KeyValueStoreService.instance;

export class QuickGetService {
  private gameMap: Record<string, Game> | undefined;
  private gameEventMap: Record<string, GameEvent> | undefined;
  private gameItemMap: Record<string, GameItem> | undefined;

  // API for Game
  async buildGameMap() {
    const data = await Game.findAll();
    const gameMap: Record<string, Game> = {};
    const metadata: RecordVersionInfo[] = [];

    data.forEach((game) => {
      gameMap[game.id.toString()] = game;

      if (game.metadata) {
        metadata.push({
          id: game.id,
          slug: game.slug,
          version: game.metadata.version,
          minVersion: game.metadata.minVersion,
          updateMessage: game.metadata.updateMessage,
        });
      }
    });

    await kvService.syncGameMetadata(metadata);

    this.gameMap = gameMap;
    return gameMap;
  }

  async getGameMap() {
    return !!this.gameMap ? this.gameMap : await this.buildGameMap();
  }

  async listGame() {
    const gameMap = !!this.gameMap ? this.gameMap : await this.buildGameMap();

    return Object.values(gameMap);
  }

  async findGame(gameId: number) {
    const gameMap = !!this.gameMap ? this.gameMap : await this.buildGameMap();

    return gameMap[gameId.toString()];
  }

  async findAllGameByGameEventId (gameEventId: number) {
    const gameDataMap = await this.getGameMap();

    return Object.values(gameDataMap).filter((gameEvent) => gameEvent.id === gameEventId);
  }

  async buildGameEventMap() {
    const data = await GameEvent.findAll();
    const gameMap: Record<string, GameEvent> = {};

    data.forEach((game) => {
      gameMap[game.id.toString()] = game;
    });

    this.gameEventMap = gameMap;

    return gameMap;
  }

  async getGameEventMap() {
    return !!this.gameEventMap ? this.gameEventMap : await this.buildGameEventMap();
  }

  async listGameEvent() {
    const gameEventMap = !!this.gameEventMap ? this.gameEventMap : await this.buildGameEventMap();

    return Object.values(gameEventMap);
  }

  async findGameEvent(gameEventId: number) {
    const gameEventMap = !!this.gameEventMap ? this.gameEventMap : await this.buildGameEventMap();

    return gameEventMap[gameEventId.toString()];
  }

  async requireGameEvent(gameEventId: number) {
    const gameEventMap = await this.findGameEvent(gameEventId);
    if (!gameEventMap) {
      throw new Error(`Game Event not found: ${gameEventId}`);
    }

    return gameEventMap;
  }

  async requireGame(gameId: number) {
    const game = await this.findGame(gameId);
    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }

    return game;
  }

  async findGamePlay(gameId: number) {
    return GamePlay.findByPk(gameId);
  }

  async requireGamePlay(gameId: number) {
    const gamePlay = await this.findGamePlay(gameId);
    if (!gamePlay) {
      throw new Error(`Game Play not found: ${gameId}`);
    }

    return gamePlay;
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
    const gameItemMap = !!this.gameItemMap
      ? this.gameItemMap
      : await this.buildGameItemMap();
    return gameItemMap[id.toString()];
  }

  async listGameItem(gameId?: number) {
    const gameItemMap = !!this.gameItemMap
      ? this.gameItemMap
      : await this.buildGameItemMap();
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
      where: {accountId},
    });
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

  async requireInventoryGame(accountId: number, inventoryId: number) {
    const inventoryGame = await GameInventoryItem.findOne({
      where: {accountId, id: inventoryId},
    });
    if (!inventoryGame) {
      throw new Error(`Inventory Item not found: ${inventoryId}`);
    }
    return inventoryGame;
  }

  async requireCountInventoryActiveGame(accountId: number) {
    const inventoryGame = await GameInventoryItem.findAndCountAll({
      where: {
        accountId,
        status: GameInventoryItemStatus.ACTIVE,
      },
    });
    if (!inventoryGame) {
      throw new Error(`Inventory Item not found: ${accountId}`);
    }
    return inventoryGame;
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
