import {createClient, RedisClientType} from 'redis';
import EnvVars from '@src/constants/EnvVars';
import {createPromise, PromiseObject} from '@src/utils';
import logger from 'jet-logger';


export class CacheService {
  private initPromise: PromiseObject<RedisClientType>;
  public readonly redisClient;
  public readonly isReady : Promise<RedisClientType>;

  public constructor() {
    const {Host, Port} = EnvVars.Redis;
    const url = `redis://${Host}:${Port}/1`;

    const initPromise = createPromise<RedisClientType>();
    this.initPromise = initPromise;
    this.isReady = initPromise.promise;
    this.redisClient = createClient({url});

    this.redisClient.on('connect', () => {
      // @ts-ignore
      initPromise.resolve(this.redisClient);
      logger.info(`Connected to Redis ${url}`);
    });

    this.redisClient.on('error', (err) => {
      logger.err(`Redis client error ${String(err)}`);
    });

    this.redisClient.connect();
  }

  // Singleton
  private static _instance: CacheService;
  public static get instance(): CacheService {
    if (!this._instance) {
      this._instance = new CacheService();
    }
    return this._instance;
  }
}
