import {IReq, IRes} from '@src/routes/types';
import {Router} from 'express';
import {Query} from 'express-serve-static-core';
import {EventService, SubmitEventParams} from '@src/services/EventService';
import {requireLogin} from '@src/routes/helper';

const EventRouter = Router();
type JoinEventQuery = {
  eventTypeSlug: string;
} & Query;

const routerMap = {
  //Get event types
  getEventTypes: async (req: IReq<Query>, res: IRes) => {
    //Get event types
    //Todo: Optimize this with caching
    const eventTypes = await EventService.instance.getEventTypes();

    return res.status(200).json(eventTypes);
  },

  //Todo: Get event histories
  getHistories: async (req: IReq<Query>, res: IRes) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.status(200).json({
      success: true,
    });
  },

  // Todo: Get leader board
  getLeaderBoard: async (req: IReq<Query>, res: IRes) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.status(200).json({
      success: true,
    });
  },

  // Join an event
  join: async (req: IReq<JoinEventQuery>, res: IRes) => {
    const address = req.session.address || '';
    const {eventTypeSlug} = req.body;

    const event = await EventService.instance.joinEvent(address, eventTypeSlug);

    return res.status(200).json(event);
  },

  // Submit join session
  submit: async (req: IReq<SubmitEventParams>, res: IRes) => {
    const {error, success, point} = await EventService.instance.submitEvent(req.body);

    return res.status(200).json({
      error,
      success,
      point,
    });
  },
};

EventRouter.get('/event-types', requireLogin, routerMap.getEventTypes);
// EventRouter.get('/histories', routerMap.getHistories);
// EventRouter.get('/leader-board', routerMap.getLeaderBoard);
EventRouter.post('/join', requireLogin, routerMap.join);
EventRouter.post('/submit', requireLogin, routerMap.submit);

export default EventRouter;