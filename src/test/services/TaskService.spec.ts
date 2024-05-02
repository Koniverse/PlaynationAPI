
import {TaskService} from '@src/services/TaskService';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {GameService} from '@src/services/GameService';
import {AccountService} from '@src/services/AccountService';
import {AccountParams, Task } from '@src/models';
describe('Task Test', () => {
  const accountService = AccountService.instance;
  const taskService = TaskService.instance;
  let taskSample: Task | null = null;
  const info: AccountParams = {
    address: '5Eo5BJntLSFRYGjzEedEguxVjH7dxo1iEXUCgXJEP2bFNHSo',
    signature: '0x660b13c0908541dcfdde53c0cb98e37ac47e4cd4d032941e53b51aac593ed81b8ec5c0ac6123c3c51bd08f1ae7b88afda838314d6727bb0dc6b0d1ad5b18438a',
    telegramId: 12345699909987,
    telegramUsername: 'john_doe',
    firstName: 'John',
    lastName: 'Doe',
    photoUrl: 'https://via.placeholder.com/300x300',
    languageCode: 'en',
  };
  beforeAll(async () => {
    await SequelizeServiceImpl.syncAll();
    await SequelizeServiceImpl.truncateDB();
    const game = await GameService.instance.generateDefaultData();
    taskSample = await Task.create({
      contentId: 0,
      gameId: game.id,
      itemReward: 300,
      name: 'Task 1',
      description: 'Task 1',
      pointReward: 100,
      interval: 1,
    } as unknown as Task);
  });

  it('Task submit interval day', async function () {
    let account = await accountService.findByAddress(info.address);

    if (!account) {
      account = await accountService.createAccount(info);
    }
    const taskId = taskSample?.id || 0;
    const taskSumit = await taskService.submit(account.id, taskId);
    expect(taskSumit.success).toEqual(true);
    try {
        await taskService.submit(account.id, taskId);

    }catch (e) {
      expect(e.message).toEqual('Task is not ready to be submitted yet');
    }

  });
});
