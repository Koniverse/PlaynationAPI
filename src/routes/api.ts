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

export default apiRouter;
