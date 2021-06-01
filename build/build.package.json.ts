import * as fs from 'fs';

const json: any = JSON.parse( fs.readFileSync( `${process.cwd()}/package.json`, "utf8" ) );

const publishJson = {
  name: json.name,
  version: json.version,
  description: json.description,
  bin: json.bin,
  typings: json.typings,
  main: json.main,
  repository: json.repository,
  keywords: json.keywords,
  author: json.author,
  license: json.license,
  bugs: json.bugs,
  homepage: json.homepage,
  publishConfig: json.publishConfig,
  dependencies: json.dependencies
};

fs.writeFileSync( `${process.cwd()}/dist/package.json`, JSON.stringify( publishJson, undefined, 2 ), 'utf8' );