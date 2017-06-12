import { Command, CommandArgs } from 'command-script';
import { MicroDocsCrawler } from "../crawler/microdocs-crawler";
import { JSLogger } from "../helpers/logging/js-logger";
import { Project, ProblemResponse } from "@maxxton/microdocs-core/domain";
import * as cliHelper from '../helpers/cli.helper';
import { ServerOptions } from "../options/server.options";
import { CheckOptions } from "../options/check.options";

import { SwaggerAdapter, PostmanAdapter, BaseAdapter } from '@maxxton/microdocs-core/adapter';


/**
 * Run like: microdocs export --format swagger --outputFile
 */
module.exports = new Command("export")
  .description("Export the project definitions to different formats")
  .option('-f, --format <FORMAT>', { desc: 'The export format, e.g. swagger, postman' })
  .option('--outputFile <FILE>', { desc: 'The location and filename for the output definition, e.g. dist/swagger.json' })
  .extends(require('./cli.build'))
  .action((args: CommandArgs, resolve: (result?: any) => void, reject: (err?: any) => void) => {
    let project: Project = args.pipeResult && args.pipeResult['project'];
    let logger = new JSLogger();
    let adapter: BaseAdapter;

    if (args.options['format'] == 'swagger') {
      adapter = new SwaggerAdapter();
    }
    else if (args.options['format'] == 'postman') {
      adapter = new PostmanAdapter();
    }
    else {
      reject("Format is unknown, use: swagger or postman");
      return;
    }
    // convert the definition
    let result: any = adapter.adapt(project);

    if (args.options['format'] == 'swagger' || args.options['format'] == 'postman') {
      cliHelper.storeResult(result, args.options['format'], args.options.outputFile);
    }

    logger.info("Export to " + args.options['format'] + " definition succeed");
  });
