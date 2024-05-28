import {Router} from 'express';
import ChainRouter from '@src/chainServer/routers/ChainRouter';

const apiRouter = Router();

apiRouter.use('/chain', ChainRouter);

export default apiRouter;
