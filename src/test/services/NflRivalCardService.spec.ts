import {NflRivalCardService} from '@src/services/game/mythicalGame/NflRivalCardService';

describe('NflRivalCardService Test', () => {
  const cardService = NflRivalCardService.instance;
  it('should getAllCard', async () => {
    const result = await cardService.getCardMap();

    expect(result).toBeDefined();
  });
  it('should getUserCard', async () => {
    const result = await cardService.getUserCard(1466229978);

    console.table(result.cards[0]);
    expect(result.cards).toBeDefined();
  });
});