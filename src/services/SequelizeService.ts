import { QueryTypes, Sequelize, Transaction } from 'sequelize';
import EnvVars from '@src/constants/EnvVars';
import { createPromise } from '@src/utils';
import { SyncOptions } from 'sequelize/types/sequelize';

export class SequelizeService {
  public readonly sequelize: Sequelize;
  public readonly isReady: Promise<Sequelize>;
  private syncList: ((options?: SyncOptions) => Promise<any>)[] = [];
  private isSyncAll = false;
  private sequenceKeys: Record<string, number> = {};

  public constructor(connectionString?: string) {
    const { promise, resolve, reject } = createPromise<Sequelize>();
    this.isReady = promise;
    const dbUrl = connectionString || EnvVars.SEQUELIZE_DB;

    this.sequelize = new Sequelize(dbUrl, {
      logging: EnvVars.NodeEnv === 'development' ? console.log : false,
    });

    this.sequelize
      .authenticate()
      .then(() => {
        console.log('Connection with Sequelize DB has been established successfully.');
        resolve(this.sequelize);
      })
      .catch((err) => {
        console.error('Unable to connect with Sequelize DB:', err);
        reject(err);
      });
  }

  public async syncAll(): Promise<void> {
    if (this.isSyncAll) {
      return;
    } else {
      for (const sync of this.syncList) {
        await sync();
      }
      this.isSyncAll = true;
    }
  }

  public addSync(method: (options?: SyncOptions) => Promise<any>): void {
    this.syncList.push(method);
    this.isSyncAll = false;
  }

  public async truncateDB(): Promise<void> {
    await this.syncAll();

    await this.sequelize.transaction(async (transaction: Transaction) => {
      await this.sequelize.truncate({ force: true, cascade: true, transaction });
    });
  }

  public async syncWithOptions(options?: SyncOptions): Promise<void> {
    await this.sequelize.transaction(async (transaction: Transaction) => {
      for (const sync of this.syncList) {
        await sync(options);
      }
    });
  }

  public async startTransaction(): Promise<Transaction> {
    return this.sequelize.transaction();
  }

  public async commitTransaction(transaction: Transaction): Promise<void> {
    await transaction.commit();
  }

  public async rollbackTransaction(transaction: Transaction): Promise<void> {
    await transaction.rollback();
  }

  /**
   * Check next value of a sequence
   * @param key
   */
  public async nextVal(key: string) {
    // Clean the key to avoid SQL injection and limit key length
    const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 36);
    const sequenceName = `custom_${cleanKey}_seq`;
    const createSequenceQuery = `CREATE SEQUENCE IF NOT EXISTS ${sequenceName} START 1 INCREMENT 1 AS INTEGER;`;
    const getNextValueQuery = `SELECT nextval('${sequenceName}')::INT AS nextval`;

    if (!this.sequenceKeys[key]) {
      // Create the sequence if it doesn't exist
      await this.sequelize.query(createSequenceQuery, {
        type: QueryTypes.RAW,
        logging: false,
      });
    }

    // Retrieve the next value from the sequence
    const result = (await this.sequelize.query(getNextValueQuery, {
      type: QueryTypes.SELECT,
    })) as [{ nextval: number }];

    return result[0].nextval;
  }
}

const SequelizeServiceImpl = new SequelizeService();
export default SequelizeServiceImpl;
