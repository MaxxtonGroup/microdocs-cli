import { Command, CommandArgs } from 'command-script';
import { MicroDocsCrawler } from "../crawler/microdocs-crawler";
import { JSLogger } from "../helpers/logging/js-logger";
import { Project, ProblemResponse } from "@maxxton/microdocs-core/domain";
import * as cliHelper from '../helpers/cli.helper';
import { ServerOptions } from "../options/server.options";
import { CheckOptions } from "../options/check.options";
import * as fs from 'fs';
import * as uuid from 'uuid';
import * as pathUtil from 'path';
import { SwaggerAdapter, PostmanAdapter, BaseAdapter } from '@maxxton/microdocs-core/adapter';

/**
 * Run like: microdocs export --format swagger --swaggerFile
 */
module.exports = new Command("export")
  .description("Export the project definitions to different formats")
  .option('-f, --format <FORMAT>', { desc: 'The export format, e.g. swagger, postman' })
  .option('--swaggerFile <FILE>', { desc: 'The location and filename for the Swagger definition, e.g. dist/swagger.json' })
  .option('--postmanFile <FILE>', { desc: 'The location and filename for the Postman definition, e.g. dist/postman.json' })
  .extends(require('./cli.build'))
  .action((args: CommandArgs, resolve: (result?: any) => void, reject: (err?: any) => void) => {
    let project: Project = args.pipeResult && args.pipeResult['project'];
    let logger = new JSLogger();
    let adapter: BaseAdapter;

    if (args.options['format'] == 'swagger') {
      adapter = new SwaggerAdapter();
    }
    else if (args.options['format'] == 'postman') {
      adapter = new MyPostmanAdapter();
    }
    else {
      reject("Format is unknown, use: swagger or postman");
      return;
    }
    // convert the definition
    let result: any = adapter.adapt(project);

    if (args.options['format'] == 'swagger') {
      let swaggerFile = args.options.swaggerFile;
      if (!swaggerFile) {
        swaggerFile = 'swagger.json';
      }

      let swaggerFolder = pathUtil.dirname(swaggerFile);
      const mkdirp = require('mkdirp');
      mkdirp.sync(swaggerFolder);
      logger.info(`Store swagger definition in '${swaggerFile}'`);
      let json = JSON.stringify(project);
      fs.writeFileSync(swaggerFile, json);
    }
    else if (args.options['format'] == 'postman') {
      let postmanFile = args.options.postmanFile;
      if (!postmanFile) {
        postmanFile = 'postman.json';
      }

      let postmanFolder = pathUtil.dirname(postmanFile);
      const mkdirp = require('mkdirp');
      mkdirp.sync(postmanFolder);
      logger.info(`Store swagger definition in '${postmanFile}'`);
      let json = JSON.stringify(result);
      fs.writeFileSync(postmanFile, json);
    }

    logger.info("Export to " + args.options['format'] + " definition succeed");
  });

class MyPostmanAdapter extends PostmanAdapter {
  adapt(project: Project): {}[] {
    return super.adapt(project);
  }

  getPostmanBase(project?: Project): {} {
    var collection: any = { item: [], info: {} };
    collection['info'] = {
      name: project.info.title,
      version: project.info.version,
      description: project.info.description
    };
    collection.info.schema = "https://schema.getpostman.com/json/collection/v2.0.0/collection.json";
    collection.info._postman_id = uuid['v4']();

    return collection;
  }
}
