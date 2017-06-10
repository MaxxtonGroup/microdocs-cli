import { Command, CommandArgs } from 'command-script';
import { MicroDocsCrawler } from "../crawler/microdocs-crawler";
import { JSLogger } from "../helpers/logging/js-logger";
import { Project, ProblemResponse } from "@maxxton/microdocs-core/domain";
import * as cliHelper from '../helpers/cli.helper';
import { ServerOptions } from "../options/server.options";
import { CheckOptions } from "../options/check.options";
import * as fs from 'fs';
import * as pathUtil from 'path';
import { SwaggerAdapter, BaseAdapter } from '@maxxton/microdocs-core/adapter';

/**
 * Run like: microdocs export --format swagger --swaggerFile
 */
module.exports = new Command( "export" )
    .description( "Export the project definitions to different formats" )
    .option( '-f, --format <FORMAT>', { desc: 'The export format, e.g. swagger' } )
    .option( '--swaggerFile <FILE>', { desc: 'The location and filename for the Swagger definition, e.g. dist/swagger.json' } )
    .extends( require( './cli.build' ) )
    .action( ( args: CommandArgs, resolve: ( result?: any ) => void, reject: ( err?: any ) => void ) => {
      let project: Project = args.pipeResult && args.pipeResult[ 'project' ];
      let logger           = new JSLogger();
      let adapter: BaseAdapter;

      if ( args.options[ 'format' ] == 'swagger' ) {
        adapter = new SwaggerAdapter();
      }
      else {
        reject( "Format is unknown, use: swagger" );
        return;
      }
      // convert the definition
      adapter.adapt( project );

      let swaggerFile = args.options.swaggerFile;
      if ( !swaggerFile ) {
        swaggerFile = 'swagger.json';
      }

      let swaggerFolder = pathUtil.dirname( swaggerFile );
      const mkdirp      = require( 'mkdirp' );
      mkdirp.sync( swaggerFolder );
      logger.info( `Store swagger definition in '${swaggerFile}'` );
      let json = JSON.stringify( project );
      fs.writeFileSync( swaggerFile, json );

      logger.info( "Export to " + args.options[ 'format' ] + " definition succeed" );
    } );
