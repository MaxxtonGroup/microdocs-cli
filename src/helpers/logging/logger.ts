export interface Logger {

  debug( ...x: any[] ): void;
  info( ...x: any[] ): void;
  log( ...x: any[] ): void;
  warn( ...x: any[] ): void;
  error( ...x: any[] ): void;

}

export function isDebug() {
  return process.env.NODE_ENV === 'debug';
}