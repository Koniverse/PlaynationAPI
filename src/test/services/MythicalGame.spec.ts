import { randomInt } from 'crypto';
import { CardInfo } from '@koniverse/telegram-bot-grpc';
import { Card_Player_Default, CardStatArr } from '@src/test/data_samples/MythicalGame';
import { CardStat, GameInfo, MythicalCardGameService } from '@src/services/game/mythicalGame/MythicalCardGameService';
import { EventInfo, MythicalEventService } from '@src/services/game/mythicalGame/MythicalEventService';
import * as console from 'node:console';

const eventService = MythicalEventService.instance;
const gameService = MythicalCardGameService.instance;

function getCombinations(array: CardInfo[], size: number): CardInfo[][] {
  const result: CardInfo[][] = [];
  const combination: CardInfo[] = [];

  function combine(start: number, depth: number) {
    if (depth === size) {
      result.push([...combination]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      combination[depth] = array[i];
      combine(i + 1, depth + 1);
    }
  }

  combine(0, 0);
  return result;
}

describe('Testing game in case with all combinations of 6-card deck', () => {
  const cardPlayerDefault = Card_Player_Default;

  for (let i = 0; i < 1; i++) {
    const statsOfEvent: CardStat[] = [];
    while (statsOfEvent.length < 4) {
      const stat = CardStatArr[randomInt(0, CardStatArr.length - 1)];
      if (!statsOfEvent.includes(stat)) {
        statsOfEvent.push(stat);
      }
    }

    describe(`Run ${i + 1}`, () => {
      let game: GameInfo;
      const cardPlayerSelectedToPlayGame = new Set<CardInfo>(cardPlayerDefault);

      test('should create an event', () => {
        const event: EventInfo = {
          seedGame: 'event_testing_beta_1',
          round: 3,
          baseDifficulty: 10,
          stats: statsOfEvent,
          gameStored: [],
        };
        eventService.createNewEvent(event);

        expect(eventService.eventRecord[event.seedGame]).toBeDefined();
        expect(eventService.eventRecord[event.seedGame]).toEqual(event);
      });

      test('should create a game of event', async () => {
        game = await eventService.startEvent('event_testing_beta_1', [...cardPlayerSelectedToPlayGame], 'player_01');

        expect(game).toBeDefined();
        expect(game.rounds.length).toEqual(3);
        expect(game.currentRound).toEqual(0);
        expect(game.state).toEqual('ready');
        expect(game.rounds.flatMap(round => round.stats).every(stat => statsOfEvent.includes(stat))).toBe(true);
      });

      for (let round = 0; round < 3; round++) {
        test('should play game', async () => {

          console.log('LOG: Game is ready to start_____________________________________');
          console.log('waiting for player to select a card....................');
          const cardPlayerToSelect = game.cardPlayerSelected;
          const cardToSelected: CardInfo = cardPlayerToSelect[randomInt(0, cardPlayerToSelect.length - 1)];

          expect(cardToSelected).not.toBeFalsy();

          if (cardToSelected?.defId) {
            const roundInfo = await eventService.playGameEachRound(
              'event_testing_beta_1',
              game.id,
              cardToSelected.defId);

            expect(roundInfo.state).toEqual('finished');
            if (roundInfo.isWin) {
              expect(roundInfo.score).toBeGreaterThan(0);
            } else {
              expect(roundInfo.score).toEqual(0);
            }

            console.log('LOG: Round Info', roundInfo);
          }
        });
      }
    });
  }
});