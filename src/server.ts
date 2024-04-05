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

import session from 'express-session';
import RedisStore from 'connect-redis';
import {createClient} from 'redis';



export async function startServer() {
  // **** Express **** //
  const app = express();

  // CORS
  app.use(cors({
    origin: EnvVars.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }));

  // Session
  const redisClient = createClient({
    url: `redis://${EnvVars.Redis.Host}:${EnvVars.Redis.Port}/0`,
  });
  await redisClient.connect();

  const redisStore = new RedisStore({client: redisClient});

  app.use(session({
    secret: EnvVars.Session.Secret,
    store: redisStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: Number(EnvVars.Session.Exp),
    },
  }));


  // **** Setup **** //
  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({extended: true}));

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
