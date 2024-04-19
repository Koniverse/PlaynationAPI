import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {TelegramService} from "@src/services/TelegramService";

const TelegramRouter = Router();

const routerMap = {
  chat: async (req: IReq<Query>, res: IRes) => {
    const response = await TelegramService.instance.getTelegramAccountData();
    return res.status(200).json({status: 'ok'});
  },
};

TelegramRouter.get('/chat', routerMap.chat);

export default TelegramRouter;
