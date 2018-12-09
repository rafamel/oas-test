/**
 * @module Info
 */

import { OpenAPIObject } from 'openapi3-ts';
import Endpoint from './endpoint';

export default interface Info {
  id: string;
  name: string;
  endpoint: Endpoint;
  iteration: number;
  context: object;
  oas: OpenAPIObject | void;
}
