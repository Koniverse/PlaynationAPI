/**
 * Environments variables declared here.
 */

/* eslint-disable node/no-process-env */
import chainConfig from '@src/data/chainConfig.json';
import * as process from "node:process";

const Environments = {
  NodeEnv: process.env.NODE_ENV ?? '',
  Port: process.env.PORT ?? 0,
  ChainPort: process.env.CHAIN_PORT ?? 0,
  INTERVAL_PRICE_TIME: process.env.INTERVAL_PRICE_TIME ?? 0,
  PRICE_TABLE: process.env.PRICE_TABLE ?? 'price',
  CHANNEL_SUBSCRIBE: process.env.CHANNEL_SUBSCRIBE ?? 'change-data',
  CHAIN_SERVICE_TABLE: process.env.CHAIN_SERVICE_TABLE ?? 'chain_service',
  ENABLE_CHAIN_SERVICE: process.env.ENABLE_CHAIN_SERVICE?.toLowerCase() === 'true',
  STAKINGINFO_TABLE: process.env.STAKINGINFO_TABLE ?? 'staking_info',
  INTERVAL_STAKINGINFO_TIME: process.env.INTERVAL_STAKINGINFO_TIME ?? 0,
  VALIDATOR_DATA_TABLE: process.env.VALIDATOR_DATA_TABLE ?? 'validator_data',
  INTERVAL_VALIDATOR_DATA_TIME: process.env.INTERVAL_VALIDATOR_DATA_TIME ?? 0,
  KEYRING_MINTER_SEED: process.env.KEYRING_MINTER_SEED ?? '',
  SEQUELIZE_DB: process.env.SEQUELIZE_DB ?? '',
  WEB3STORAGE_TOKEN: process.env.WEB3STORAGE_TOKEN ?? '',
  SUBSCAN_URL: process.env.SUBSCAN_URL ?? 'https://polkadot.api.subscan.io',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
  SUBSCAN_HEADER: JSON.parse(process.env.SUBSCAN_HEADER ?? '{}') as Record<string, string>,
  CHECK_BALANCE_NETWORKS: process.env.CHECK_BALANCE_NETWORKS ?? '', // polkadot,kusama...
  ONFINALITY_TOKEN: process.env.ONFINALITY_TOKEN ?? '',
  ADDRESS_FAUCET_SEND: process.env.ADDRESS_FAUCET_SEND ?? '',
  TOKEN_ID_LIST: process.env.TOKEN_ID_LIST?.split(',') ?? [101, 200070014],
  NUMBER_OF_SEND: Number(process.env.NUMBER_OF_SEND) ?? 1,
  SIGNATURE_RANDOM_CODE: process.env.SIGNATURE_RANDOM_CODE ?? '',
  INDIRECT_POINT_RATE: parseFloat(process.env.INDIRECT_POINT_RATE || '0.05'),
  DefaultData: {
    KusamaEndpoint: process.env.KUSAMA_ENDPOINT || 'wss://kusama-rpc.polkadot.io',
    RMRKCollectionId: process.env.DEFAULT_COLLECTION_ID || '',
    IPFSFolder: process.env.IPFS_FOLDER || '',
    NftImage: process.env.DEFAULT_NFT_IMAGE || 'https://via.placeholder.com/500x500?text=NFT',
  },
  Redis: {
    Host: process.env.REDIS_HOST ?? 'localhost',
    Port: process.env.REDIS_PORT ?? 6379,
  },
  Telegram: {
    Token: process.env.BOT_TELEGRAM_TOKEN ?? '',
    IntervalTime: Number(process.env.INTERVAL_TELEGRAM_TIME || '1000'),
    IntervalCronTime: Number(process.env.INTERVAL_TELEGRAM_CRON_TIME || '86400000'),
    RateLimit: Number(process.env.TELEGRAM_RATE_LIMIT || '20'),
    CronRateLimit: Number(process.env.TELEGRAM_CRON_RATE_LIMIT || '20'),
  },
  Subscan: {
    RateLimit: Number(process.env.SUBSCAN_RATE_LIMIT || '20'),
    IntervalTime: Number(process.env.INTERVAL_SUBSCAN_TIME || '1000'),
  },
  Mongo: {
    Host: process.env.MONGO_HOST ?? 'localhost',
    Port: process.env.MONGO_PORT ?? 27001,
    Database: process.env.MONGO_DB ?? 'airdrop',
    Username: process.env.MONGO_USER ?? 'mongo',
    Password: process.env.MONGO_PASSWORD ?? '',
  },
  CookieProps: {
    Key: 'ExpressGeneratorTs',
    Secret: process.env.COOKIE_SECRET ?? '',
    // Casing to match express cookie options
    Options: {
      httpOnly: true,
      signed: true,
      path: process.env.COOKIE_PATH ?? '',
      maxAge: Number(process.env.COOKIE_EXP ?? 0),
      domain: process.env.COOKIE_DOMAIN ?? '',
      secure: process.env.SECURE_COOKIE === 'true',
    },
  },
  Secret: {
    Token: process.env.SECRET_TOKEN ?? '',
  },
  Jwt: {
    Secret: process.env.JWT_SECRET ?? '',
    Exp: process.env.COOKIE_EXP ?? '', // exp at the same time as the cookie
  },
  Session: {
    Secret: process.env.SESSION_SECRET ?? 'xxxxxxxxx',
    Exp: process.env.SESSION_EXP ?? 259200000,
  },
  Game: {
    MaxEnergy: parseInt(process.env.MAX_ENERGY || '1440'),
    EnergyRecoverTime: parseInt(process.env.ENGERY_RECOVER_TIME || '60'),
    EnergyPrice: parseInt(process.env.ENERGY_PRICE || '1'),
    EnergyBuyLimit: parseInt(process.env.ENERGY_BUY_LIMIT || '5'),
    EnergyOneBuy: parseInt(process.env.ENERGY_ONE_BUY || '1'),
    MaxBuyEnergy: parseInt(process.env.MAX_BUY_ENERGY || '1'),
  },
  GameItem: {
    EternalItem: parseInt(process.env.ETERNAL_ITEM || '-1'),
    DisposableItem: parseInt(process.env.DISPOSABLE_ITEM || '0'),
    ItemLevel: process.env.ITEM_LEVEL || 'LEVEL',
    ItemMulti: process.env.ITEM_MULTIPLIER || 'MULTIPLIER',
    ItemMaxLevel: parseInt(process.env.ITEM_MAX_LEVEL || '100'),
    BuyType: process.env.BUY_TYPE || 'BUY_MULTI',
  },
  ChainService: {
    Endpoint: process.env.CHAIN_SERVICE_ENDPOINT ?? '',
    Token: process.env.CHAIN_SERVICE_TOKEN ?? '',
    networkConfig: chainConfig,
    minimumBalance: parseInt(process.env.MINIMUM_BALANCE || '30'),
    estimatedFee: parseFloat(process.env.ESTIMATED_FEE || '0.002410001367'),
  },
  TaskOnChain: {
    IntervalTime: parseInt(process.env.INTERVAL_TASK_ON_CHAIN_TIME || '6000'),
    RetryMax: parseInt(process.env.TASK_HISTORY_RETRY_MAX || '3'),
    Limit: parseInt(process.env.TASK_HISTORY_LIMIT || '20'),
  },
  Airlyft: {
    Url: process.env.AIRLYFT_URL ?? 'https://fuel.airlyft.one/graphql',
    CommunityName: process.env.AIRLYFT_COMMUNITY_NAME ?? 'zealy',
    ProjectId: process.env.AIRLYFT_PROJECT_ID ?? '',
    RateLimit: Number(process.env.AIRLYFT_RATE_LIMIT || '20'),
    IntervalTime: Number(process.env.INTERVAL_AIRLYFT_TIME || '43200000'),
    IntervalCronTime: Number(process.env.INTERVAL_AIRLYFT_CRON_TIME || '86400000'),
    TaskSync: process.env.TASK_AIRLYFT_SYNC ?? 'zealy_sync',
    TaskUrlSync: process.env.TASK_AIRLYFT_URL_SYNC ?? 'zealy_sync',
    Token: process.env.AIRLYFT_TOKEN ?? '',
    LoginUrl: process.env.AIRLYFT_LOGIN_URL,
    Address: process.env.AIRLYFT_ADDRESS,
    Message: process.env.AIRLYFT_MESSAGE,
    Signature: process.env.AIRLYFT_SIGNATURE,

  },
};

export default Environments;
if (Environments.NodeEnv === 'development') {
  console.log('Start server with environments', Environments);
}
