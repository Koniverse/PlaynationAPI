import {TelegramService} from '@src/services/TelegramService';
import {Account} from '@src/models';
import {Op} from 'sequelize';

describe('Telegram Test', () => {
  const telegramService = TelegramService.instance;
  const telegramId = 1466229978;

  it('Telegram Basic Action', async function () {
    await telegramService.addTelegramAction('sendPhoto', {
      'chat_id': telegramId,
      'caption': 'Check out the new missions, complete them, and earn more 😘 NPS!',
      'photo': 'https://booka-media.koni.studio/image_0cc2798a8a.png',
      'parse_mode': 'html',
      'reply_markup': {
        'inline_keyboard': [
          [
            {
              'text': 'Open App',
              'web_app': {
                'url': 'https://booka.koni.studio/home/mission',
              },
            },
          ],
        ],
      },
    });
  });

  it('Get Telegram Avatar', async function () {
    const fileURL = await telegramService.getUrlProfile(telegramId);

    console.log(fileURL);
  });

  it('Save Avatar', async function () {
    // eslint-disable-next-line no-constant-condition
    while (1) {
      const accounts = await Account.findAll({limit: 20, where: {cronAvatar: {[Op.not]: true}}});

      if (accounts.length === 0) {
        break;
      }

      const promises = accounts.map(async (account) => {
        await telegramService.saveTelegramAccountAvatar(account.telegramId);
      });
      await Promise.all(promises);
    }
  });
});