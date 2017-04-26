#!/usr/bin/env node

import {Cli} from 'command-script';
import * as fs from 'fs';

// Load package json
let packageJson: any;
if(fs.existsSync('../package.json')) {
  packageJson = require('../package.json');
}else{
  packageJson = require('../../package.json');
}

let cli = new Cli({
  packageJson: packageJson
});

cli.command(require('./cli.build'));
cli.command(require('./cli.check'));
cli.command(require('./cli.login'));

cli.command('help')
    .description('Show help')
    .order(2000)
    .action(() => {
      cli.showHelp();
    });

cli.run(process.argv.splice(2));