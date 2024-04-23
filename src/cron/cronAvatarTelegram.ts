import EnvVars from '@src/constants/EnvVars';
import { TelegramService } from '@src/services/TelegramService';
import {Account} from '@src/models';
import {Op} from 'sequelize';

const INTERVAL_TIME = EnvVars.Telegram.IntervalCronTime;
const telegramService = TelegramService.instance;
export async function fetchImageAndSaveToDatabase() {
  try {
    console.log('Fetching image and saving to database...');
    const accountDataList = await Account.findAll({
      order: [['id', 'ASC']],
      where: {
        cronAvatar: {
          [Op.or]: [null, false],
        },
      } as never,
      limit: EnvVars.Telegram.CronRateLimit,
    });
    const promises = accountDataList.map( (account) => {
      return telegramService.saveImageTelegram(account.telegramId);
    });
    await Promise.all(promises);
  } catch (error) {
    console.error('Error fetching image:', error);
  }
}

if (INTERVAL_TIME > 0) {
  setInterval(() => {
    fetchImageAndSaveToDatabase().catch(console.error);
  }, INTERVAL_TIME );

}
