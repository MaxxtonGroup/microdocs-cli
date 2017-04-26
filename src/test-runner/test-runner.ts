import { Project } from "@maxxton/microdocs-core/domain";

/**
 * Test runner for Newman
 */
export class TestRunner {

  public run( postmanCollection: any, runOptions:any = {} ): Promise<boolean> {
    return new Promise( ( resolve: ( result: boolean ) => void, reject: ( err?: any ) => void ) => {
      const newman = require( 'newman' );

      runOptions.collection = postmanCollection;
      runOptions.reporters = runOptions.reporters || 'cli';
      newman.run( runOptions, function ( err?: any ) {
        if ( err ) {
          reject( err );
        }
        resolve(true);
      } );
    } );
  }

  public convertToPostman( project: Project ): any {
    const PostmanHelper = require('@maxxton/microdocs-core/helpers/postman/postman.helper');
    const postmanHelper = new PostmanHelper();
    return postmanHelper.convert(project);
  }

}