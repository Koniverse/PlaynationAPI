import './setup';
import logger from 'jet-logger';
import EnvVars from '@src/constants/EnvVars';
import {startServer} from '@src/chainServer/server';

startServer()
  .then((app) => {
    const SERVER_START_MSG = ('Express server started on port: ' + EnvVars.ChainPort.toString());
    app.listen(EnvVars.ChainPort, () => logger.info(SERVER_START_MSG));
  }).catch(console.log);


