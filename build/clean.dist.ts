import rimraf = require('rimraf');
rimraf(`${process.cwd()}/dist`, e => {
  if ( e ) {
    console.warn( `Clean task failed with ${ e }` );
  } else {
    console.info( `removed dist` );
  }
});
