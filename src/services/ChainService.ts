import {Extrinsic} from '@polkadot/types/interfaces';
import {v4} from 'uuid';
import EventEmitter from 'eventemitter3';
import {ChainServiceEventMap, ExtrinsicEventData} from '@src/types';
import {ApiPromise, WsProvider} from '@polkadot/api';
import {IKeyringPair, Registry} from '@polkadot/types/types';
import {createPromise} from '@src/utils';
import {TypeRegistry} from '@polkadot/types';
import {cryptoWaitReady} from '@polkadot/util-crypto';
import {keyring} from '@polkadot/ui-keyring';
import EnvVars from '@src/constants/EnvVars';
import '@polkadot/types-augment';
import logger from 'jet-logger';
import {SubmittableExtrinsic} from '@polkadot/api/promise/types';
import {BN, u8aToHex} from '@polkadot/util';
import * as console from 'node:console';
import * as process from 'node:process';

const BATCH_MAX_SIZE = 24;
export interface ExtrinsicWithId {
  id: string;
  extrinsic: Extrinsic;
}

export class ChainService {
  private emitter = new EventEmitter<ChainServiceEventMap>();

  public readonly isReady: Promise<ApiPromise>;
  private registry: Registry;
  // @ts-ignore
  private api: ApiPromise;
  // @ts-ignore
  private keypair: IKeyringPair;

  private extrinsicQueue: ExtrinsicWithId[] = [];
  private queueStatus: 'running' | 'waiting';
  private isConnecting = true;
  private sendAddress: string;


  public constructor(endpoint: string, address: string, seedPhrase: string) {
    this.queueStatus = 'waiting';
    
    const {resolve, reject, promise} = createPromise<ApiPromise>();
    this.isReady = promise;
    this.registry = new TypeRegistry();
    this.sendAddress = address;
    
    // Init web3 action on crypto ready
    cryptoWaitReady().then(() => {
      // keyring.loadAll({type: 'sr25519'});
      try {
        
        this.keypair = keyring.createFromUri(seedPhrase, {name: 'Minter'}, 'sr25519');

        const api = new ApiPromise({
          provider: new WsProvider(endpoint, 3000),
          registry: this.registry,
        });
        this.api = api;

        api.isReady.then(() => {
          console.log('Api is ready', endpoint);
          this.isConnecting = false;
          resolve(api);
        });
      
        let reconnectInterval: NodeJS.Timeout;
      
        api.on('connected', () => {
          if (this.isConnecting) {
            clearInterval(reconnectInterval);
            this.isConnecting = false;
          }
        });
      
        api.on('disconnected', () => {
          if (!this.isConnecting) {
            this.isConnecting = true;
          
            reconnectInterval = setInterval(async () => {
              await this.disconnect();
              await this.connect();
            }, 30000);
          }
        });
      }catch (e) {
        console.log('error:', e);
      }
    }).catch(e => console.log('error:' ,e ));
  }

  public async getKeypairPublicKey() {
    await this.isReady;
    return u8aToHex(this.keypair.publicKey);
  }

  public async getKeypairAddress() {
    await this.isReady;
    return this.keypair.address;
  }

  public async connect() {
    try {
      if (!this.api?.isConnected) {
        const api = await this.getApi();
        return api.connect();
      }
    } catch (e) {
      logger.err(e);
    }
  }

  public async disconnect() {
    try {
      if (this.api && this.api.isConnected) {
        return this.api.disconnect();
      }
    } catch (e) {
      logger.err(e);
    }
  }

  public async getApi() {
    return await this.isReady;
  }

  public async getLatestBlockNumber() {
    const api = await this.getApi();
    return (await api.query.system.number()).toPrimitive() as number;
  }

  public async checkBalancesSend(address: string, amount: BN) {
    const api = await this.getApi();
    if (!address) {
      return false;
    }
    // @ts-ignore
    const { data: { free: balance } } = await api.query.system.account(this.sendAddress);
    return balance.gte(amount);
  }

  
  public async runExtrinsic(extrinsic: Extrinsic) {
    const eid = this.addExtrinsic(extrinsic);
      
    return await new Promise<ExtrinsicEventData>((resolve, reject) => {
      this.on('extrinsic_success', (edata) => {
        if (edata.id === eid) {
          resolve(edata);
        }
      });
        
      this.on('extrinsic_error', (edata) => {
        if (edata.id === eid) {
          reject(edata);
        }
      });
    });
  }

  public addExtrinsic(extrinsic: Extrinsic) {
    const id = v4();
    this.extrinsicQueue.push({id, extrinsic});
    this.emitter.emit('extrinsic_add', {id});

    // Add some delay to run extrinsic, and allow more extrinsic in the batch in the run() method
    setTimeout(() => {
      this.run().catch(console.error);
    }, 1000);

    return id;
  }

  private async run() {
    if (this.queueStatus === 'running') {
      return;
    }

    this.queueStatus = 'running';

    while (this.extrinsicQueue.length > 0) {
      // Init event data
      const eventData: ExtrinsicEventData = {id: ''};

      // Get batch of extrinsics
      const entries = this.extrinsicQueue.splice(0, BATCH_MAX_SIZE);
      const indexMap: Record<number, string> = {};
      const runningList = entries.map(({id, extrinsic}, index) => {
        indexMap[index] = id;
        return extrinsic;
      });

      // Create emit methods
      const emitEvent = async (event: keyof ChainServiceEventMap, emitData: ExtrinsicEventData) => {
        if (emitData.blockHash) {
          const api = await this.getApi();
          emitData.blockNumber = (await api.query.system.number.at(emitData.blockHash)).toPrimitive() as number;
        }
        Object.values(indexMap).forEach((id) => {
          this.emitter.emit(event, {...emitData, id});
        });
      };

      // Start perform batch
      try {
        const api = await this.getApi();
        // eventData.blockNumber = (await api.query.system.number()).toPrimitive() as number;
  
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout'));
          }, 60000);
  
          logger.info(`Running batch with (${runningList.length} extrinsics)`);

          // If there is more than 1 extrinsic, we need to use batch
          const submittable = runningList.length > 1 ? api.tx.utility.batch(runningList): runningList[0] as SubmittableExtrinsic;
          // Handle batch result
          submittable.signAndSend(this.keypair, ({events = [], status, txHash}) => {
            if (status.isInBlock) {
              eventData.blockHash = status.asInBlock.toHex();
            }

            if (status.isFinalized) {
              clearTimeout(timeout);
              
              events.filter(({ event: { section } }) => section === 'system')
                .forEach(({ event: { method, data: [error] } }): void => {
                  if (method === 'ExtrinsicFailed') {
                    emitEvent('extrinsic_error',{...eventData, extrinsicHash: txHash.toHex()});
                  } else if (method === 'ExtrinsicSuccess') {
                    emitEvent('extrinsic_success',{...eventData, extrinsicHash: txHash.toHex()});
                  }
                });
  
              resolve(true);
            }
          }).catch((e) => {
            clearTimeout(timeout);
            reject(e);
          });
        });
      } catch (e) {
        emitEvent('extrinsic_error', {...eventData}).catch(console.log);
      }
    }

    // Return to waiting status if queue is empty
    this.queueStatus = 'waiting';
  }

  public on(event: keyof ChainServiceEventMap, callback: (eData: ExtrinsicEventData) => void) {
    this.emitter.on(event, callback);
  }

  public off(event: keyof ChainServiceEventMap, callback: (eData: ExtrinsicEventData) => void) {
    this.emitter.off(event, callback);
  }
}

