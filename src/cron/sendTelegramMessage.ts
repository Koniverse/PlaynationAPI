import EnvVars from '@src/constants/EnvVars';

const INTERVAL_TELEGRAM_TIME = Number(EnvVars.Telegram.IntervalTime || 0);

async function renewSendMessageTelegram() {
  console.log('Renew data staking info done!');
  console.log('Send message to telegram');
  await Promise.resolve();
}


if (INTERVAL_TELEGRAM_TIME > 0) {
  setInterval(() => {
    renewSendMessageTelegram().catch(console.error);
  }, INTERVAL_TELEGRAM_TIME);

}
