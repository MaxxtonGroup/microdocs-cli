import { Command, CommandArgs } from 'command-script';
import { MicroDocsCrawler } from "../crawler/microdocs-crawler";
import { JSLogger } from "../helpers/logging/js-logger";
import { Project, ProblemResponse } from "@maxxton/microdocs-core/domain";
import * as cliHelper from '../helpers/cli.helper';
import { ServerOptions } from "../options/server.options";
import { CheckOptions } from "../options/check.options";
import * as path from "path";

module.exports = new Command( "check" )
    .description( "Check for problems with other projects" )
    .option( '-t, --title <TITLE>', { desc: 'Project title' } )
    .option( '-e, --env <ENV>', { desc: 'Specify the environment' } )
    .option( '--bitbucket-pr-url <URL>', { desc: 'Post comments in a pull request in Bitbucket' } )
    .option( '--bitbucket-username <USERNAME>', { desc: 'Username of Bitbucket' } )
    .option( '--bitbucket-password <PASSWORD>', { desc: 'Password of Bitbucket' } )
    .extends( require( './cli.build' ))
    .extends( require( './cli.login' ), (args:CommandArgs) => args.flags['no-checking'] = true)
    .action( ( args: CommandArgs, resolve: ( result?: any ) => void, reject: ( err?: any ) => void ) => {
      let project: Project             = args.pipeResult && args.pipeResult['project'];
      let serverOptions: ServerOptions = args.pipeResult && args.pipeResult['server'];
      let logger                       = new JSLogger();
      if ( !project ) {
        reject( "Project is missing" );
        return;
      }
      let checkOptions: CheckOptions = Object.assign( serverOptions, {
        title: args.options.title,
        env: args.options.env,
        bitBucketPullRequestUrl: args.options['bitbucket-pr-url'],
        bitBucketUsername: args.options['bitbucket-username'],
        bitBucketPassword: args.options['bitbucket-password']
      } );
      let crawler                    = new MicroDocsCrawler( logger );
      crawler.check( project, checkOptions ).then( ( problemResult: ProblemResponse ) => {
        cliHelper.printProblemResponse( problemResult, [path.resolve(process.cwd(), args.options.source)], logger );
        resolve();
      }, reject );
    } );