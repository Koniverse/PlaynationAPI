import {Router} from 'express';
import AccountRouter from '@src/routes/AccountRouter';
import EventRouter from '@src/routes/EventRouter';
import ShopRouter from '@src/routes/ShopRouter';

const apiRouter = Router();

apiRouter.use('/account', AccountRouter);
apiRouter.use('/event', EventRouter);
apiRouter.use('/shop', ShopRouter);

// apiRouter.use('/chain-info', ChainRouter);
// apiRouter.use('/user', UserRouter);
// apiRouter.use('/collection', CollectionRouter);
// apiRouter.use('/mint', MintRouter);
// apiRouter.use('/faucet',FaucetRouter);

export default apiRouter;
