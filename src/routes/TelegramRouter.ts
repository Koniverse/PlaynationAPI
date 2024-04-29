import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {TelegramService} from '@src/services/TelegramService';
import {requireSecret} from '@src/routes/helper';
import {TelegramParams} from '@src/types';

const TelegramRouter = Router();
const telegramService = TelegramService.instance;

const routerMap = {
  sendPhoto: async (req: IReq<TelegramParams>, res: IRes) => {
    const accountNumber = await telegramService.sendPhotoToAll(req.body);
    return res.status(200).json({
      status: 'ok',
      accountNumber,
    });
  },
  saveAvatar: async (req: IReq<TelegramParams>, res: IRes) => {
    const user_id = req.body.user_id ?? 0;
    await telegramService.saveTelegramAccountAvatar(user_id);
    return res.status(200).json({status: 'ok'});
  },
};

TelegramRouter.post('/send-photo', requireSecret, routerMap.sendPhoto);
TelegramRouter.post('/save-avatar', requireSecret, routerMap.saveAvatar);

export default TelegramRouter;
