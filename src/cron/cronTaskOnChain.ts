import EnvVars from '@src/constants/EnvVars';
import {Account, Task, TaskHistory, TaskHistoryStatus} from '@src/models';
import {Op} from 'sequelize';
import fetch from 'node-fetch';
import {ExtrinsicSubscanResult} from '@src/other/typeSubsan';
import * as console from 'console';
import {AccountService} from '@src/services/AccountService';

const INTERVAL_TIME = EnvVars.TaskOnChain.IntervalTime;
const MAP_NETWORK = {
  'alephTest': 'alephzero-testnet',
} as Record<string, string>;
export async function checkTaskOnChange() {
  try {
    const taskHistoryChecking: TaskHistory[] = await TaskHistory.findAll({
      where: {
        status: TaskHistoryStatus.CHECKING,
        extrinsicHash: {
          [Op.not]: null,
        },
        network: {
          [Op.not]: null,
        },
      } as never,
      limit: EnvVars.TaskOnChain.Limit
    });
    for (const taskHistory of taskHistoryChecking) {
      const extrinsicHash = taskHistory.extrinsicHash;
      const network = taskHistory.network;
      if (!extrinsicHash || !network) {
        continue;
      }
      const task = await Task.findByPk(taskHistory.taskId);
      if (!task) {
        continue;
      }
      const isOnChain = await checkExtrinsicHashOnSubscan(extrinsicHash, network);
      if (isOnChain) {
        taskHistory.status = TaskHistoryStatus.COMPLETED;
        taskHistory.completedAt = new Date();
        await taskHistory.save();
        if (!taskHistory.accountId) {
          continue;
        }
        const account = await Account.findByPk(taskHistory.accountId);
        if (!account) {
          continue;
        }
        await AccountService.instance.addAccountPoint(taskHistory.accountId, task.pointReward);
      }else {
        taskHistory.retry = taskHistory.retry + 1;
        if (taskHistory.retry >= EnvVars.TaskOnChain.RetryMax) {
          taskHistory.status = TaskHistoryStatus.FAILED;
        }
        await taskHistory.save();

      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function checkExtrinsicHashOnSubscan(extrinsicHash: string, network: string) {
  const raw = JSON.stringify({
    'hash': extrinsicHash,
  });
  const slug = MAP_NETWORK[network] ||  null;
  if (!slug) {
    return false;
  }
  const url = `https://${slug}.api.subscan.io/api/scan/extrinsic`;
  const response = await fetch(
    url,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: raw,
      redirect: 'follow',
    });
  const extrinsicSubscanResult = await response.json() as ExtrinsicSubscanResult;
  const now = new Date();
  const extrinsicDate = new Date(extrinsicSubscanResult.data.block_timestamp * 1000);

  if (now.getFullYear() !== extrinsicDate.getFullYear() || now.getMonth() !== extrinsicDate.getMonth() || now.getDate() !== extrinsicDate.getDate())  {
    return false;
  }
  return extrinsicSubscanResult.data.success;
}

if (INTERVAL_TIME > 0) {

  setInterval(() => {
    checkTaskOnChange().catch(console.error);
  }, INTERVAL_TIME );
}
