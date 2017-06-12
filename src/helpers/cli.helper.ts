
import { ProblemResponse, ProblemLevels, Problem } from "@maxxton/microdocs-core/domain";
import * as fs from 'fs';
import * as pathUtil from 'path';
import { JSLogger } from "./logging/js-logger";
import { Logger } from './logging/logger';

export function storeResult(result: any, format: string, file: string): void {
  let logger: Logger = new JSLogger();

  if (!file) {
    file = 'swagger.json';
  }

  let swaggerFolder = pathUtil.dirname(file);
  const mkdirp = require('mkdirp');
  mkdirp.sync(swaggerFolder);
  logger.info(`Store ${format} definition in '${file}'`);
  let json = JSON.stringify(result);
  fs.writeFileSync(file, json);
}

export function printProblemResponse(response: ProblemResponse, folders: string[] = [process.cwd()], logger: Logger = new JSLogger()): boolean {
  var hasProblems = response.status !== 'ok';
  var errorCount = 0;
  var warningCount = 0;
  var noticeCount = 0;
  if (response.problems) {
    errorCount = response.problems.filter(problem => problem.level === ProblemLevels.ERROR).length;
    warningCount = response.problems.filter(problem => problem.level === ProblemLevels.WARNING).length;
    noticeCount = response.problems.filter(problem => problem.level === ProblemLevels.NOTICE).length;
  }

  var message = "\n";
  if (errorCount + warningCount + noticeCount > 0) {
    message += "Project contains problems: ";
    if (errorCount > 0) {
      message += errorCount + " error" + (errorCount > 1 ? 's' : '') + ',';
    }
    if (warningCount > 0) {
      message += warningCount + " warning" + (warningCount > 1 ? 's' : '') + ',';
    }
    if (noticeCount > 0) {
      message += noticeCount + " notice" + (noticeCount > 1 ? 's' : '') + ',';
    }
    if (message.indexOf(',', message.length - 1) !== -1) {
      message.substring(0, 1);
    }
  } else {
    message += response.message;
  }
  if (hasProblems) {
    logger.warn(message);
  } else {
    logger.info(message);
  }

  if (response.problems) {
    response.problems.forEach(problem => {
      var msg = "\n";
      var lineNumber = problem.lineNumber && problem.lineNumber > 0 ? ':' + problem.lineNumber : ':0';
      var path = problem.path;
      if (folders) {
        var matches = folders.filter(folder => fs.existsSync(folder + '/' + path));
        if (matches.length > 0) {
          path = matches[0] + '/' + path;
        }
      }
      if (path) {
        var sourceFile = path + lineNumber;
        msg = sourceFile + ": " + problem.level + ": " + problem.message;
      } else {
        msg += problem.level + ": " + problem.message;
      }
      if (problem.client) {
        msg += "\nBreaking change detected with " + problem.client.title;
        if (problem.client.sourceLink || problem.client.className) {
          msg += " (source: " + (problem.client.sourceLink ? problem.client.sourceLink : problem.client.className) + ")";
        }
      }
      if (hasProblems) {
        logger.warn(msg);
      } else {
        logger.info(msg);
      }
    });
  }

  return !hasProblems;
}

export function formatProblemMessage(problem: Problem): string {
  let msg = problem.level + ': ' + problem.message;
  if (problem.client) {
    msg += "\nBreaking change detected with " + problem.client.title;
    if (problem.client.sourceLink || problem.client.className) {
      msg += " (source: " + (problem.client.sourceLink ? problem.client.sourceLink : problem.client.className) + ")";
    }
  }
  return msg;
}
