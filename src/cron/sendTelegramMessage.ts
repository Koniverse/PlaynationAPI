import EnvVars from '@src/constants/EnvVars';
import {TelegramParams, TelegramService} from '@src/services/TelegramService';

const INTERVAL_TELEGRAM_TIME = Number(EnvVars.Telegram.IntervalTime || 0);
const telegramService = TelegramService.instance;
async function renewSendMessageTelegram() {
  console.log('Send message to telegram');
  const data = await telegramService.getTelegramList() as Record<string, TelegramParams>;
  // console.log('data', data)
  let count = 0;
  const promises = [];
  for (const key of Object.keys(data)) {
      console.log('key', key)
    const item = data[key] as TelegramParams;
    const telegramId = String(item.telegramId);
    const message = 'Are you having a good day? Let\'s revisit earning more NPS – there\'s some big news on the way!';
    const dataSend = {
      chat_id: telegramId,
      photo: 'https://booka-media.koni.studio/image_0cc2798a8a.png',
      caption: message,
      'parse_mode': 'html',
    };
    telegramService.removeTelegramList(String(item.telegramId));
    promises.push(telegramService.sendTelegramMessage(telegramId, dataSend));
  }
  await Promise.all(promises);

  await Promise.resolve();
}


if (INTERVAL_TELEGRAM_TIME > 0) {
  setInterval(() => {
    renewSendMessageTelegram().catch(console.error);
  }, INTERVAL_TELEGRAM_TIME );

}
