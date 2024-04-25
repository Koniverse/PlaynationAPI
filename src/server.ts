/**
 * Setup express server.
 */

import morgan from 'morgan';
import helmet from 'helmet';
import express, {Request, Response, NextFunction} from 'express';
import logger from 'jet-logger';
import 'express-async-errors';
import cors from 'cors';
import ApiRouter from '@src/routes/api';
import EnvVars from '@src/constants/EnvVars';
import HttpStatusCodes from '@src/constants/HttpStatusCodes';
import {NodeEnvs} from '@src/constants/misc';
import {RouteError} from '@src/other/classes';
import path from "path";


export async function startServer() {
  // **** Express **** //
  const app = express();

  await Promise.resolve();

  // CORS
  app.use(cors({
    origin: EnvVars.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }));


  // **** Setup **** //
  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({extended: true}));
  app.use(express.static(path.join(__dirname, '../public')));

  // Show routes called in console during development
  if (EnvVars.NodeEnv === NodeEnvs.Dev) {
    app.use(morgan('dev'));
  }

  // Security
  if (EnvVars.NodeEnv === NodeEnvs.Production) {
    app.use(helmet());
  }

  // Add APIs, must be after middleware
  app.use('/api', ApiRouter);

  // Add error handler
  app.use((
    err: Error,
    _: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction,
  ) => {
    if (EnvVars.NodeEnv !== NodeEnvs.Test) {
      logger.err(err, true);
    }
    let status = HttpStatusCodes.BAD_REQUEST;
    if (err instanceof RouteError) {
      status = err.status;
    }
    return res.status(status).json({error: err.message});
  });


  return app;
}
