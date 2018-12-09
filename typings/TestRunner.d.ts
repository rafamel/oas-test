/**
 * @module TestRunner
 */

import { OpenAPIObject } from 'openapi3-ts';
import { Request, Response } from 'superagent';
import Info from './info';
import Tasks, { Task } from './tasks';
import Data, { Fake } from './data';

declare enum HookType {
  Data = 'data',
  Request = 'request',
  Response = 'response'
}

type DataHookCb = (
  data: Data | void,
  fake: Fake,
  info: Info,
  task: Task
) => Data | void;
type RequestHookCb = (req: Request, info: Info, task: Task) => void;
type ResponseHookCb = (res: Response, info: Info, task: Task) => void;
type SelfCb = (testRunner?: TestRunner) => any;

interface Tests {
  [id: string]: Tasks;
}

interface Settings {
  // tslint:disable-next-line
  assert?: Function;
  // tslint:disable-next-line
  describe?: Function;
  // tslint:disable-next-line
  test?: Function;
  logger?: any;
  logall?: boolean;
  errorHandler?: (error: Error) => void;
}
interface Config {
  app?: object;
  url?: string;
  oas?: OpenAPIObject;
}

declare class TestRunner {
  public context: object;
  public promise: Promise<any>;
  public load(config: Config): TestRunner;
  public settings(settings: Settings): TestRunner;
  public hook(
    type: HookType,
    hook: DataHookCb | RequestHookCb | ResponseHookCb
  );
  public clone(): TestRunner;
  public self(cb: SelfCb): TestRunner;
  public test(tests: Tests): TestRunner;
}

export default TestRunner;
