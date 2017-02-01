# MicroDocs CLI
Command line interface for MicroDocs

## Install
```
echo @maxxton:registry=https://npm.maxxton.com > ~/.npmrc
npm install -g @maxxton/microdocs-cli
```

## Commands
```
build [options]                         Build a MicroDocs definitions from source files
check [options]                         Check for problems with other projects
login [options]                         Login to a MicroDocs Server
help                                    Show help
```


## Development
### Setup
```
npm install
npm run linkDeps
npm run link
npm run watch
```
### Test
```
npm run test
```
### Build
```
npm run prepublish
```