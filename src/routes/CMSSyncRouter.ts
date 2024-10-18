import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {requireSecret} from '@src/routes/helper';
import {CMSSyncPayload, CMSSyncService} from '@src/services/CMSSyncService';

const CMSSyncRouter = Router();
const cmsSyncService = CMSSyncService.instance;

const routerMap = {
  sync: async (req: IReq<CMSSyncPayload>, res: IRes) => {
    const model = req.params.model;
    const action = req.params.action;
    try {
      await cmsSyncService.sync(model, action, req.body);
      return res.status(200).json({
        status: 'ok',
      });
    } catch (e) {
      return res.status(503).json({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        error: e.message,
      });
    }
  },
};

CMSSyncRouter.post('/:model/:action', requireSecret, routerMap.sync);

export default CMSSyncRouter;
