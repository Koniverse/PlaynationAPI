/**
 * Pre-start is where we want to place things that must run BEFORE the express 
 * server is started. This is useful for environment variables, command-line 
 * arguments, and cron-jobs.
 */

// NOTE: DO NOT IMPORT ANY SOURCE CODE HERE
import path from 'path';
import dotenv from 'dotenv';
import * as process from 'process';


// **** Types **** //

// Set the env file
const environmentConfig = dotenv.config({
  path: path.resolve(process.cwd(), './.env-test'),
});
if (environmentConfig.error) {
  throw environmentConfig.error;
}
