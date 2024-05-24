import './setupEnvironment';
import './setupChains';
import logger from 'jet-logger';
import EnvVars from '@src/constants/EnvVars';
import {startServer} from '@src/chainServer/server';

console.log('Hello World', EnvVars.Port);

startServer()
  .then((app) => {
    const SERVER_START_MSG = ('Express server started on port: ' + EnvVars.Port.toString());
    app.listen(EnvVars.Port, () => logger.info(SERVER_START_MSG));
  }).catch(console.log);


