/**
 * @module Data
 */

interface DataByMimeTypes {
  [mimeType: string]: Data;
}

export interface Fake {
  required: Data | DataByMimeTypes;
  all: Data | DataByMimeTypes;
  mimeTypes: string[];
}

interface Parameters {
  [id: string]: any;
}

export default interface Data {
  params: Parameters;
  headers: Parameters;
  query: Parameters;
  cookies: Parameters;
  body: any;
}
