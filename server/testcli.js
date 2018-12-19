global.APP_HOST =
  process.env.NODE_ENV === 'development'
    ? 'https://localhost:8089'
    : 'https://server.vaithuhay.com'
global.APP_PATH = __dirname

import program from 'commander'
import * as tests from '@server/test'

process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p)
  })
  .on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrown')
    // process.exit(1);
  })

program
  .version('0.0.1')
  .command('run <name> [args...]')
  .action((name, args) => tests[name](...args))

program.parse(process.argv)
