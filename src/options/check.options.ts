import { ServerOptions } from "./server.options";

export interface CheckOptions extends ServerOptions{

  title?: string;
  env?:string;
  sourceFolder?:string;
  bitBucketPullRequestUrl?:string;
  bitBucketUsername?:string;
  bitBucketPassword?:string;

}