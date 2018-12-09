/**
 * @module Tasks
 */

import { Request, Response } from 'superagent';
import Info from './info';
import Data, { Fake } from './data';

type RequestCb = (req: Request, info: Info, task: Task) => void;
type DataCb = (fake: Fake | void, info: Info, task: Task) => Data | void;
type ResponseCb = (res: Response, info: Info, task: Task) => void;

export interface Task {
  request?: RequestCb;
  data?: DataCb | Data | boolean;
  response?: ResponseCb;
  validate?: number | string;
  repeat?: number;
}

export default interface Tasks {
  [name: string]: Task;
}
