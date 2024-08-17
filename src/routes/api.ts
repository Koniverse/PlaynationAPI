import { Router } from 'express';
import AccountRouter from '@src/routes/AccountRouter';
import GameRouter from '@src/routes/GameRouter';
import ShopRouter from '@src/routes/ShopRouter';
import TaskRouter from '@src/routes/TaskRouter';
import TelegramRouter from '@src/routes/TelegramRouter';
import TaskCategoryRouter from '@src/routes/TaskCategoryRouter';
import AirdropRouter from '@src/routes/AirdropRouter';
import AirlyftRouter from '@src/routes/AirlyftRouter';
import KeyValueRouter from '@src/routes/KeyValueRouter';
import LeaderboardRouter from '@src/routes/LeaderboardRouter';
import PublicRouter from '@src/routes/PublicRouter';
import MetadataRouter from '@src/routes/MetadataRouter';

const apiRouter = Router();

apiRouter.use('/account', AccountRouter);
apiRouter.use('/game', GameRouter);
apiRouter.use('/shop', ShopRouter);
apiRouter.use('/task', TaskRouter);
apiRouter.use('/task-category', TaskCategoryRouter);
apiRouter.use('/telegram', TelegramRouter);
apiRouter.use('/airdrop', AirdropRouter);
apiRouter.use('/airlyft', AirlyftRouter);
apiRouter.use('/key-value', KeyValueRouter);
apiRouter.use('/leaderboard', LeaderboardRouter);
apiRouter.use('/public', PublicRouter);
apiRouter.use('/metadata', MetadataRouter);

export default apiRouter;
