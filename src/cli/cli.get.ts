import { Command, CommandArgs } from "command-script";
import { ServerOptions } from "../options/server.options";
import { MicroDocsCrawler } from "../crawler/microdocs-crawler";
import { JSLogger } from "../helpers/logging/js-logger";
import { MicroDocsClient } from "../clients/microdocs-client";
import { ClusterOptions } from "../options/cluster.options";

/**
 * Run like: microdocs get order-service:2.0.0 -f postman
 */
module.exports = new Command("get")
    .description("Get info about a environment, group, project or version")
    .arg("PROJECT", {optional: true, rest: false})
    .option( '-e, --env <ENV>', { desc: 'Specify the environment' } )
    .option( '-f, --format <FORMAT>', { desc: 'The export format, e.g. human, microdocs, swagger, postman or docker-compose' } )
    .flag( '--pretty', { desc: 'Pretty print JSON output' } )
    .extends(require('./cli.login'))
    .action( ( args: CommandArgs, resolve: ( result?: any ) => void, reject: ( err?: any ) => void ) => {
      let logger = new JSLogger();
      let mdocsClient = new MicroDocsClient( logger );
      let serverOptions: ServerOptions = args.pipeResult && args.pipeResult['server'];
      let pretty = args.flags['pretty'];

      // extract filter options
      let projectRef:string = args.args[0];
      let project:string;
      let group:string;
      let version:string;
      if(projectRef) {
        if ( projectRef.indexOf( ':' ) ) {
          let semicolonIndex = projectRef.indexOf( ":" );
          version            = projectRef.substring( semicolonIndex + 1 );
          projectRef         = projectRef.substring( 0, semicolonIndex );
        }
        if ( projectRef.indexOf( '/' ) ) {
          let slashIndex = projectRef.indexOf( "/" );
          group          = projectRef.substring( 0, slashIndex );
          projectRef     = projectRef.substring( slashIndex + 1 );
        }
        if ( projectRef.match( /^[^:\/]*$/ ) ) {
          project = projectRef;
        } else {
          let error = `project name is not in the right format: ${projectRef} [group/project:version]`;
          reject( error );
          return
        }
      }

      // options to build up a request
      let clusterOptions = <ClusterOptions> {
        url: serverOptions.url,
        username: serverOptions.username,
        password: serverOptions.password,
        env: args.options['env'],
        filterGroups: group,
        targetProject: project,
        targetVersion: version,
        exportType: args.options['format']
      };

      mdocsClient.getProjects(clusterOptions, (
          response => {
        if(response.status === 'failed'){
          reject(response.message);
        }else{
          if(typeof(response) === 'object'){
            response = JSON.stringify(response, null, pretty ? 2 : undefined);
          }
          resolve(response);
        }
      }));
    });
