import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {TelegramService} from '@src/services/TelegramService';
import {requireSecret} from '@src/routes/helper';
import {TelegramParams} from '@src/types';

const TelegramRouter = Router();

const routerMap = {
  sendPhoto: async (req: IReq<TelegramParams>, res: IRes) => {
    await TelegramService.instance.addTelegramMessage(req.body);
    return res.status(200).json({status: 'ok'});
  },
};

TelegramRouter.post('/send-photo', requireSecret, routerMap.sendPhoto);

export default TelegramRouter;
