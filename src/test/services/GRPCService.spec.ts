import {GRPCService} from '@src/services/GRPCService';

describe('GRPCService Test', () => {
  it('should validate result', async () => {
    const botUsername = 'anhmtvDevBot';
    const initData = 'query_id=AAHa5GRXAAAAANrkZFfGUxFM&user=%7B%22id%22%3A1466229978%2C%22first_name%22%3A%22Peter%22%2C%22last_name%22%3A%22Mai%22%2C%22username%22%3A%22petermai%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&auth_date=1727860820&hash=7e463c327e80694b9f08f6f01eee9cfa1ee3ea282ef603554e822c5bfe107fd2';

    const rs = await GRPCService.instance.validateTelegramInitData(initData, botUsername);

    console.table(rs.params?.telegramUser);
  });
});