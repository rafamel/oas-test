/**
 * @module Endpoint
 */

import { OperationObject } from 'openapi3-ts';

export default interface Endpoint {
  path: string;
  method: string;
  operation: OperationObject | void;
}
