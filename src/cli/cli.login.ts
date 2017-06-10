import { Command } from 'command-script';
import { ServerOptions } from "../options/server.options";

export default new Command( "login" )
    .description("Login to a MicroDocs Server")
    .option( '-s, --url <URL>', { desc: 'Url of the MicroDocs Server', order: 50, value: 'http://localhost:3000' } )
    .option( '-U, --username <USERNAME>', { desc: 'Username of the MicroDocs Server', order: 51 } )
    .option( '-P, --password <PASSWORD>', { desc: 'Password of the MicroDocs Server', order: 52 } )
    .flag('--no-credentials-store', {desc: "Don't store the credentials in the credentials store"})
    .flag('--no-checking', {desc: "Don't check if the credentials are valid"})
    .action( ( args: { args?: any[], options?: any, flags?: any }, resolve: ( result?: any ) => void, reject: ( err?: any ) => void ) => {
        const MicroDocsCrawler = require( '../crawler/microdocs-crawler' ).MicroDocsCrawler;
        const JSLogger         = require( '../helpers/logging/js-logger' ).JSLogger;

        let logger = new JSLogger();
        let crawler = new MicroDocsCrawler( logger );

        crawler.login({
            url: args.options.url,
            username: args.options.username,
            password: args.options.password,
            noCredentialStore: args.flags['no-credentials-store'],
            noChecking: args.flags['no-checking']
        }).then((serverOptions:ServerOptions) => {
            if(!args.flags['no-checking']){
                logger.debug('Logged in!');
            }
            resolve({server: serverOptions});
        }, reject);
    } );