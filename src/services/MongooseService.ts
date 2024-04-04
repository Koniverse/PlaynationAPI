import EnvVars from '@src/constants/EnvVars';
import mongoose, {Mongoose} from 'mongoose';

export class MongooseService {
  private mongoose: Mongoose | undefined;
  public readonly isReady: Promise<Mongoose>;

  public constructor() {
    const {Host, Port, Username, Password, Database} = EnvVars.Mongo;
    const connectionString = `mongodb://${Host}:${Port}`;

    this.isReady = mongoose.connect(connectionString, {
      user: Username,
      pass: Password,
      dbName: Database,
    });

    this.isReady.then((mongoose) => {
      this.mongoose = mongoose;
      console.log('Connected to MongoDB', connectionString, Database);

      return mongoose;
    })
      .catch(e => {
        console.error('Error connecting to MongoDB', e);
      });

  }
}

const MongooseServiceImpl =  new MongooseService();
export default MongooseServiceImpl;