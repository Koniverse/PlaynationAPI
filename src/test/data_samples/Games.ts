import { Game, GameData, GameItem } from '@src/models';


export async function createSampleGameData(accountId:number) {
  const gameIds = await getAllGameIds();
  const GameList = generateGameRecords(1, 1, 'booka', 10);
  const GameItemList = await generateRecordGameItems(1, 32, gameIds);

  function generateGameRecords(startId: number, contentId: number, baseSlug: string, count: number) {
    return Array.from({ length: count }, (_, i) => ({
      id: startId + i,
      contentId: contentId + i,
      slug: `${baseSlug}-${i}`,
      name: 'Booka Game',
      url: 'https://booka.com',
      description: 'Default event type',
      maxEnergy: 1440,
      energyPerGame: 90,
      maxPointPerGame: 100000000,
      icon: 'https://via.placeholder.com/150',
      banner: 'https://via.placeholder.com/1200x600',
      rankDefinition: '{}',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  async function getAllGameIds(): Promise<number[]> {
    const games = await Game.findAll({ attributes: ['id'] });
    return games.map(game => game.id);
  }

  async function generateRecordGameItems(baseContentId: number, baseGameId: number, gameIds: number[]) {
    return Array.from({ length: 100 }, (_, index) => {
      const gameId = gameIds[Math.floor(Math.random() * gameIds.length)]; // Get a random game ID from the list
      return {
        id: 100 + index,
        contentId: baseContentId + index,
        gameId: gameId ? gameId : 1,
        name: `item ${100 + index + 1}`,
        description: `description ${100 + index + 1}`,
        slug: `game-${baseGameId}-${index}`,
        itemGroup: '1',
        itemGroupLevel: 1,
        tokenPrice: 0,
        maxBuy: 0,
        maxBuyDaily: 0,
        price: 100,
        effectDuration: 0,
      };
    });
  }
  const GameDataList = [
    {
      accountId,
      level: 1,
      point: 0,
      rank: 0,
      dayLimit: 0,
      gameId:1
    }
  ]

  return Promise.all([
    ...GameList.map(game => Game.create(game)),
    ...GameItemList.map(gameItem => GameItem.create(gameItem)),
    ...GameDataList.map(gameData => GameData.create(gameData))
  ]);
}


