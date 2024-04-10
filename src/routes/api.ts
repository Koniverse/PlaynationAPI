import {Router} from 'express';
import AccountRouter from '@src/routes/AccountRouter';
import GameRouter from '@src/routes/GameRouter';
import ShopRouter from '@src/routes/ShopRouter';
import TaskRouter from '@src/routes/TaskRouter';

const apiRouter = Router();

apiRouter.use('/account', AccountRouter);
apiRouter.use('/game', GameRouter);
apiRouter.use('/shop', ShopRouter);
apiRouter.use('/task', TaskRouter);

// apiRouter.use('/chain-info', ChainRouter);
// apiRouter.use('/user', UserRouter);
// apiRouter.use('/collection', CollectionRouter);
// apiRouter.use('/mint', MintRouter);
// apiRouter.use('/faucet',FaucetRouter);

export default apiRouter;
