global.APP_HOST = 'https://localhost:8089'
global.APP_PATH = __dirname
global.VERBOSE = true

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

// program
//   .version('0.0.1')
//   .command('run <name> [args...]')
//   .action((name, args) => tests[name](...args).then(() => process.exit(0)))

for (const name in tests)
  if (name !== '__esModule') {
    let test = tests[name],
      command = program.version(test.version || '0.0.1').command(name)
    if (typeof test.options === 'object')
      for (const op in test.options)
        command = command.option(op, test.options[op])
    command = command.action(args => test(args).then(() => process.exit(0)))
  }

program.parse(process.argv)
