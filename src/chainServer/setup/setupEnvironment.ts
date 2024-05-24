/**
 * Pre-start is where we want to place things that must run BEFORE the express 
 * server is started. This is useful for environment variables, command-line 
 * arguments, and cron-jobs.
 */

// NOTE: DO NOT IMPORT ANY SOURCE CODE HERE
import path from 'path';
import dotenv from 'dotenv';
import { parse } from 'ts-command-line-args';
import * as process from 'process';


// **** Types **** //

interface IArgs {
  env: string;
}

// **** Setup **** //

// Command line arguments
const args = parse<IArgs>({
  env: {
    type: String,
    defaultValue: 'development',
    alias: 'e',
  },
});

try {
  // Set the env file
  const environmentConfig = dotenv.config({
    path: path.resolve(process.cwd(), args.env === 'development' ? './.env-chain-development': './.env-chain'),
  });
  if (environmentConfig.error) {
    throw environmentConfig.error;
  }
} catch (e) {
  console.error(e);
}
