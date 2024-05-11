import EnvVars from '@src/constants/EnvVars';
import { TelegramService } from '@src/services/TelegramService';
import {Account, TaskHistory, TaskHistoryStatus} from '@src/models';
import {Op} from 'sequelize';
import fetch from 'node-fetch';
import {ExtrinsicSubscanData, ExtrinsicSubscanResult} from "@src/other/typeSubsan";

const INTERVAL_TIME = 0;
const telegramService = TelegramService.instance;
export async function checkTaskOnChange() {
  try {
    const taskHistoryChecking = await TaskHistory.findAll({
      where: {
        status: TaskHistoryStatus.CHECKING,
      },
    });
    for (const task of taskHistoryChecking) {
      const extrinsicHash = task.extrinsicHash;
      if (!extrinsicHash) {
        continue;
      }
      const isOnChain = await checkExtrinsicHashOnSubsan(extrinsicHash);
      // if (isOnChain) {
      //   task.status = TaskHistoryStatus.COMPLETED;
      //   await task.save();
      // }
    }
  } catch (error) {
    console.error('Error fetching image:', error);
  }
}

async function checkExtrinsicHashOnSubsan(extrinsicHash: string) {
  const raw = JSON.stringify({
    'hash': extrinsicHash,
  });
  console.log('raw', raw);
  const url = 'https://alephzero-testnet.api.subscan.io/api/scan/extrinsic';
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
  const data = await response.json() as ExtrinsicSubscanResult;
  console.log('data', data);
}

if (INTERVAL_TIME > 0) {

  setInterval(() => {
    checkTaskOnChange().catch(console.error);
  }, INTERVAL_TIME );
}
