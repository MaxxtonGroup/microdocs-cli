import { Command, CommandArgs } from 'command-script';
import { MicroDocsCrawler } from "../crawler/microdocs-crawler";
import { JSLogger } from "../helpers/logging/js-logger";
import { Project, ProblemResponse } from "@maxxton/microdocs-core/domain";
import * as cliHelper from '../helpers/cli.helper';
import { ServerOptions } from "../options/server.options";
import { CheckOptions } from "../options/check.options";

module.exports = new Command( "test" )
    .description( "Run integration tests with the Newman test runner" )
    .flag('--no-run', {desc: "Don't execute the tests"})
    .extends( require( './cli.build' ), (args:CommandArgs) => args.flags['no-checking'] = true)
    .action( ( args: CommandArgs, resolve: ( result?: any ) => void, reject: ( err?: any ) => void ) => {
      let project: Project             = args.pipeResult && args.pipeResult['project'];
      let logger                       = new JSLogger();
      if ( !project ) {
        reject( "Project is missing" );
        return;
      }


    } );