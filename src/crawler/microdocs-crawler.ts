import { Project, ProblemResponse, ProblemLevels } from '@maxxton/microdocs-core/domain';
import { ProjectBuilder } from '@maxxton/microdocs-core/builder/index';
import * as fs from 'fs';
import * as pathUtil from 'path';

import { CrawlerException } from "./common/crawler.exception";
import { Framework, FRAMEWORKS } from "./frameworks";
import { CheckOptions } from "../options/check.options";
import { MicroDocsClient } from "../clients/microdocs-client";
import { PublishOptions } from "../options/publish.options";
import { ServerOptions } from "../options/server.options";
import { Logger } from '../helpers/logging/logger';

/**
 * Base crawler to crawl Typescript sources
 */
export class MicroDocsCrawler {

  private readonly logger: Logger;

  constructor( logger: Logger ) {
    this.logger = logger;
  }

  /**
   * Build the MicroDocs definitions from source
   * @param options
   * @param callback
   * @return {Project}
   */
  public build( options: { source?: string, filePatterns?: string[], tsConfig?: string, definitionFile?: string, noCache?: boolean, noBuild?: boolean, injects?: string[] } ): Promise<Project> {
    return new Promise<Project>( ( resolve: ( project: Project ) => void, reject: ( err: any ) => void ) => {
      try {
        let source         = pathUtil.resolve( (options && options.source) || process.cwd() );
        let filePatterns   = (options && options.filePatterns) || [ '/**/*.ts', '!/**/*.spec.ts' ];
        let tsConfigFile   = (options && options.tsConfig) || 'tsconfig.json';
        let definitionFile = (options && options.definitionFile) || 'microdocs.json';
        let noCache        = (options && options.noCache) || false;
        let noBuild        = (options && options.noBuild) || false;
        let injects        = (options && options.injects) || [];

        let resolveMapper = (project:Project) => {
          const SchemaHelper = require('@maxxton/microdocs-core/helpers/schema/schema.helper').SchemaHelper;
          if(injects){
            injects.filter(inject => inject.split('=').length >= 2).forEach(inject => {
              let slices = inject.split('=');
              let key = slices[0];
              let value = slices.slice(1, slices.length).join('=');
              let evalValue = eval(value);
              project = SchemaHelper.setProperty(project, key, evalValue);
            });
          }
          resolve(project);
        };

        if ( noCache && noBuild ) {
          let error = new Error( "'no build' and 'no cache' cannot be used at the same time" );
          reject( error );
          return;
        }

        let sourceFiles: string[] = this.getSourceFiles( source, filePatterns );
        if ( sourceFiles.length == 0 ) {
          let error: Error = new CrawlerException( `No sources found in '${source}' which matches '${filePatterns}'` );
          reject( error );
          return;
        }

        let hashFile: string = definitionFile + '.hash';
        if ( definitionFile && fs.existsSync( definitionFile ) && !noCache ) {
          if ( noBuild ) {
            try {
              let project: Project = <Project>require( definitionFile );
              this.logger.info( "Skip building the MicroDocs definitions, use the '--no-cache' option to enforce this" );
              resolveMapper( project );
              return;
            } catch ( e ) {
              let error = new Error( `Definition file could not be loaded from '${definitionFile}'` );
              reject( error );
            }
          } else if ( hashFile && fs.existsSync( hashFile ) ) {
            let hash     = fs.readFileSync( hashFile );
            const hasher = require( 'glob-hash' );
            hasher( { include: sourceFiles, filenames: true } ).then( ( newHash: any ) => {
              if ( newHash === hash.toString() ) {
                try {
                  let project: Project = <Project>require( definitionFile );
                  this.logger.info( "Skip building the MicroDocs definitions, use the '--no-cache' option to enforce this" );
                  resolveMapper( project );
                  return;
                } catch ( e ) {
                  this.logger.warn( `Failed to load cached definitions from '${definitionFile}', rebuilding definitions...` );
                }
              }
              this.buildDefinition( source, sourceFiles, tsConfigFile, definitionFile, injects, newHash.hash )
                  .then( ( project: Project ) => resolve( project ), ( error: any ) => reject( error ) );
            }, ( err: any ) => {
              reject( err );
            } );
            return;
          }
        }else if(noBuild){
          throw new Error("No definition file provided, use the '--definitionFile' option for this");
        }

        this.buildDefinition( source, sourceFiles, tsConfigFile, definitionFile, injects )
            .then( ( project: Project ) => resolveMapper( project ), ( error: any ) => reject( error ) );
      } catch ( e ) {
        reject( e );
      }

    } );
  }

  /**
   * Build definitions and save it to a file with a hash of the sources
   * @param source
   * @param filePatterns
   * @param tsConfigFile
   * @param definitionFile
   * @param hash
   * @return {Promise<Project>}
   */
  private buildDefinition( source: string, sourceFiles: string[], tsConfigFile: string, definitionFile: string, injects:string[], hash?: string ): Promise<Project> {
    return new Promise<Project>( ( resolve: ( project: Project ) => void, reject: ( err: any ) => void ) => {
      try {


        let tsConfig: any = this.getTsConfig( tsConfigFile, [ source, process.cwd() ] );
        if ( !tsConfig ) {
          this.logger.warn( `No tsConfig found in '${tsConfigFile}', use default compile options` );
          tsConfig = {};
        }
        if ( tsConfig.ignoreCompilerErrors !== false ) {
          tsConfig.ignoreCompilerErrors = true;
        }

        let project: Project = this.buildProject( sourceFiles, tsConfig );

        const SchemaHelper = require('@maxxton/microdocs-core/helpers/schema/schema.helper').SchemaHelper;
        if(injects){
          injects.filter(inject => inject.split('=').length >= 2).forEach(inject => {
            let slices = inject.split('=');
            let key = slices[0];
            let value = slices.slice(1, slices.length).join('=');
            let evalValue = eval(value);
            project = SchemaHelper.setProperty(project, key, evalValue);
          });
        }

        if ( definitionFile ) {
          this.logger.info( `Store definitions in '${definitionFile}'` );
          let hashFile         = definitionFile + '.hash';
          let json             = JSON.stringify( project );
          let definitionFolder = pathUtil.dirname( definitionFile );
          const mkdirp         = require( 'mkdirp' );
          mkdirp.sync( definitionFolder );
          if ( hash ) {
            fs.writeFileSync( hashFile, hash );
            try {
              fs.writeFileSync( definitionFile, json );
            } catch ( e ) {
              try {
                fs.unlink( hashFile );
              } catch ( ee ) {
              }
              throw e;
            }
          } else {
            const hasher = require( 'glob-hash' );
            hasher( { include: sourceFiles, filenames: true } ).then( ( newHash: any ) => {
              try {
                fs.writeFileSync( hashFile, newHash );
                try {
                  fs.writeFileSync( definitionFile, json );
                } catch ( e ) {
                  try {
                    fs.unlink( hashFile );
                  } catch ( ee ) {
                  }
                  throw e;
                }
              } catch ( err ) {
                reject( err );
              }
            }, ( err: any ) => {
              reject( err );
            } );
          }
        }

        resolve( project );
      } catch ( e ) {
        reject( e );
      }
    } );
  }


  /**
   * Build the MicroDocs definitions from source
   * @param sources entry points to start crawling
   * @param tsConfig typescript compiler options
   * @param frameworks specify which frameworks should be build
   * @returns {Project} MicroDocs definition
   */
  private buildProject( sources: string[], tsConfig: {} = {}, frameworks: Framework[] = FRAMEWORKS ): Project {
    const Application = require( "@maxxton/typedoc" ).Application;
    const RootCrawler = require( "./common/root.crawler" ).RootCrawler;

    // Check frameworks
    if ( frameworks.length == 0 ) {
      throw new CrawlerException( 'No framework selected' );
    }

    // Convert source to reflection
    this.logger.info( 'Crawl sources with config:' );
    this.logger.info( JSON.stringify( tsConfig, undefined, 2 ) );
    let typedocApplication = new Application( tsConfig );
    let reflect            = typedocApplication.convert( sources );

    if ( !reflect ) {
      throw new Error( "Compiling failed" );
    }

    // Init Crawling
    let rootCrawler = new RootCrawler();
    frameworks.forEach( framework => {
      framework.initCrawlers().forEach( crawler => rootCrawler.registerCrawler( crawler ) );
    } );

    // Start Crawling
    let projectBuilder = new ProjectBuilder();
    rootCrawler.crawl( projectBuilder, reflect );

    return projectBuilder.build();
  }

  /**
   * Login to the MicroDocs server and store/load credentials to a config file
   * @param options
   * @return {Promise<ServerOptions>}
   */
  public login( options: { url?: string, username?: string, password?: string, noCredentialStore?: boolean, noChecking?: boolean } ): Promise<ServerOptions> {
    return new Promise( ( resolve: ( result: ServerOptions ) => void, reject: ( err?: any ) => void ) => {
      try {
        const Preferences                = require( "preferences" );
        const prefs                      = new Preferences( 'microdocs', {
          server: {
            url: 'http://localhost:3000',
            username: '',
            password: ''
          }
        } );
        let url                          = options.url || prefs.server.url;
        let username                     = options.username || prefs.server.username;
        let password                     = options.password || prefs.server.password;
        let serverOptions: ServerOptions = {
          url: url,
          username: username,
          password: password
        };
        let noChecking                   = options.noChecking || false;
        let noCredentialStore            = options.noCredentialStore;
        if ( noChecking ) {
          if ( noCredentialStore ) {
            resolve( serverOptions );
          } else {
            prefs.server = serverOptions;
            resolve( serverOptions );
          }
        } else {
          new MicroDocsClient( this.logger ).login( serverOptions ).then( () => {
            try {
              if ( noCredentialStore ) {
                resolve( serverOptions );
              } else {
                prefs.server = serverOptions;
                resolve( serverOptions );
              }
            } catch ( e ) {
              reject( e );
            }
          }, reject );
        }
      } catch ( e ) {
        reject( e );
      }
    } );
  }

  public check( project: Project, checkOptions: CheckOptions ): Promise<ProblemResponse> {
    return new Promise( ( resolve: ( result: ProblemResponse ) => void, reject: ( err?: any ) => void ) => {
      let microDocsClient = new MicroDocsClient( this.logger );
      microDocsClient.check( checkOptions, project ).then( ( problemResponse: ProblemResponse ) => {
        if ( checkOptions.bitBucketPullRequestUrl ) {
          this.publishToBitBucket( checkOptions, problemResponse ).then( resolve, reject );
        } else {
          resolve( problemResponse );
        }
      }, reject );
    } );
  }

  public publish( project: Project, publishOptions: PublishOptions ): Promise<ProblemResponse> {
    return new Promise( ( resolve: ( result: ProblemResponse ) => void, reject: ( err?: any ) => void ) => {
      let microDocsClient = new MicroDocsClient( this.logger );
      microDocsClient.publish( publishOptions, project ).then( ( problemResponse: ProblemResponse ) => {
        if ( publishOptions.bitBucketPullRequestUrl ) {
          this.publishToBitBucket( publishOptions, problemResponse ).then( resolve, reject );
        } else {
          resolve( problemResponse );
        }
      }, reject );
    } );
  }

  private publishToBitBucket( checkOptions: CheckOptions, problemResponse: ProblemResponse ): Promise<ProblemResponse> {
    const BitBucketClient = require( "../clients/bitbucket-client" ).BitBucketClient;
    return new BitBucketClient( this.logger ).publishToBitBucket( checkOptions, problemResponse );
  }

  private getSourceFiles( sourceFolder: string, filePatterns: string[] ): string[] {
    const globby = require( 'globby' );
    return globby[ 'sync' ]( filePatterns.map( pattern => {
      if ( pattern.indexOf( '!' ) === 0 ) {
        return '!' + pathUtil.join( sourceFolder, pattern.substring( 1 ) );
      } else {
        return pathUtil.join( sourceFolder, pattern );
      }
    } ) );
  }

  private getTsConfig( tsConfigFile: string, folders: string[] ): any {
    if ( fs.existsSync( tsConfigFile ) ) {
      try {
        this.logger.info( `Load tsConfig from '${tsConfigFile}'` );
        var tsConfig = require( tsConfigFile );
        if ( tsConfig.compilerOptions ) {
          if ( tsConfig.compilerOptions.ignoreCompilerErrors !== false ) {
            tsConfig.compilerOptions.ignoreCompilerErrors = true;
          }
          return tsConfig.compilerOptions;
        }
      } catch ( e ) {
        console.error( e );
      }
    }
    for ( let i = 0; i < folders.length; i++ ) {
      let tsFile = pathUtil.join( folders[ i ] + '/' + tsConfigFile );
      if ( fs.existsSync( tsFile ) ) {
        try {
          this.logger.info( `Load tsConfig from '${tsFile}'` );
          var tsConfig = require( tsFile );
          if ( tsConfig.compilerOptions ) {
            if ( tsConfig.compilerOptions.ignoreCompilerErrors !== false ) {
              tsConfig.compilerOptions.ignoreCompilerErrors = true;
            }
            return tsConfig.compilerOptions;
          }
        } catch ( e ) {
          console.error( e );
        }
      }
    }
    return null;
  }

}


