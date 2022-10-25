import * as core from '@actions/core';
import yargs from 'yargs';
import { checkCommand } from './commands/check.js';

async function run() {
  try {
    void yargs(process.argv.slice(2))
      .command(checkCommand)
      .env()
      .demandCommand()
      .argv;
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

void run();
