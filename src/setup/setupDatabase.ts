/**
 * Pre-start is where we want to place things that must run BEFORE the express 
 * server is started. This is useful for environment variables, command-line 
 * arguments, and cron-jobs.
 */

import SequelizeServiceImpl from '@src/services/SequelizeService';
import '../models';

// MongooseServiceImpl.isReady.catch(console.error);
// CacheServiceImpl.isReady.catch(console.error);
SequelizeServiceImpl.syncAll().then(() => {
  // EventService.instance.generateDefaultEventType().catch(console.error);
}).catch(console.error);