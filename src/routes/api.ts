import {Router} from 'express';
import ChainRouter from '@src/routes/MetadataRouter';
import MintRouter from '@src/routes/MintRouter';
import CollectionRouter from '@src/routes/CollectionRouter';
import UserRouter from '@src/routes/UserRouter';
import FaucetRouter from '@src/routes/FaucetRouter';

const apiRouter = Router();

apiRouter.use('/chain-info', ChainRouter);
apiRouter.use('/user', UserRouter);
apiRouter.use('/collection', CollectionRouter);
apiRouter.use('/mint', MintRouter);
apiRouter.use('/faucet',FaucetRouter);

export default apiRouter;
