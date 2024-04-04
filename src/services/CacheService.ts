import {createClient, RedisClientType} from 'redis';
import EnvVars from '@src/constants/EnvVars';
import {createPromise, PromiseObject} from '@src/utils';


export class CacheService {
  public readonly redisClient;
  private initPromise: PromiseObject<RedisClientType>;
  public readonly isReady : Promise<RedisClientType>;

  public constructor() {
    const {Host, Port} = EnvVars.Redis;
    const url = `redis://${Host}:${Port}`;

    const initPromise = createPromise<RedisClientType>();
    this.initPromise = initPromise;
    this.isReady = initPromise.promise;
    this.redisClient = createClient({url});

    this.redisClient.on('connect', () => {
      // @ts-ignore
      initPromise.resolve(this.redisClient);
      console.log('Connected to Redis', url);
    });

    this.redisClient.on('error', (err) => {
      console.error('Redis client error', err);
    });

    this.redisClient.connect();
  }
}

const CacheServiceImpl =  new CacheService();
export default CacheServiceImpl;