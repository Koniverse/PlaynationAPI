
import {TaskService} from '@src/services/TaskService';
import SequelizeServiceImpl from '@src/services/SequelizeService';
import {GameService} from '@src/services/GameService';
import {AccountService} from '@src/services/AccountService';
import {AccountParams, Task, TaskHistory} from '@src/models';

async function updateTaskHistoryCreatedAt(accountId: number, taskId: number, diffDays: number) {
  const latestLast = await TaskHistory.findAll({
    where: {taskId, accountId},
    order: [['createdAt', 'DESC']],
    limit: 1,
  });
  if (latestLast.length > 0) {
    const lastSubmit = latestLast[0];
    const createdAt = lastSubmit.createdAt;
    createdAt.setDate(new Date().getDate() + diffDays);
    await TaskHistory.update({createdAt}, {where: {id: lastSubmit.id}});
  }
}

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
  // Update TaskHistory createdAt to be the same as Task createdAt

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
    const taskSubmit = await taskService.submit(account.id, taskId);
    console.log('Task submit done');
    expect(taskSubmit.success).toEqual(true);
    // Submit more
    try {
      await taskService.submit(account.id, taskId);
    }catch (e) {
      expect(e.message).toEqual('Task is not ready to be submitted yet');
    }

    await updateTaskHistoryCreatedAt(account.id, taskId, -1);
    console.log('Update last submit before 1 day');
    const taskSubmit1 = await taskService.submit(account.id, taskId);
    expect(taskSubmit1.success).toEqual(true);
    console.log('Task submit before 1 day done');

    await updateTaskHistoryCreatedAt(account.id, taskId, 1);
    console.log('Update last submit after 1 day');
    try {
      await taskService.submit(account.id, taskId);

    }catch (e) {
      expect(e.message).toEqual('Task is not ready to be submitted yet');
    }

  });
});
