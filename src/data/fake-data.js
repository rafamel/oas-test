import schemaToDraft04 from 'openapi-schema-to-json-schema';
import jsf from 'json-schema-faker';

// TODO increase json schema faker string generator randomness
function getMimeTypes(operation) {
  const { parameters, requestBody } = operation;
  const content = requestBody && requestBody.content;

  let mimeTypes = [];
  if (content) mimeTypes = mimeTypes.concat(Object.keys(content));
  if (parameters) {
    parameters.forEach(({ content }) => {
      if (content) mimeTypes = mimeTypes.concat(Object.keys(content));
    });
  }
  return mimeTypes.filter((x, i, arr) => arr.indexOf(x) === i);
}

function getSchemasForMimeType(operation, mimeType) {
  const { parameters, requestBody } = operation;
  const content = requestBody && requestBody.content;

  const ans = {
    params: null,
    headers: null,
    query: null,
    cookies: null,
    body: null
  };

  if (
    content &&
    content.hasOwnProperty(mimeType) &&
    content[mimeType].hasOwnProperty('schema')
  ) {
    ans.body = schemaToDraft04(content[mimeType].schema);
  }

  if (parameters) {
    parameters.forEach((parameter) => {
      const schema =
        parameter.content && parameter.content[mimeType]
          ? parameter.content[mimeType].schema
          : parameter.schema;

      const dict = {
        query: 'query',
        header: 'headers',
        path: 'params',
        cookie: 'cookies'
      };
      const key = dict[parameter.in];
      if (!ans[key]) {
        ans[key] = { type: 'object', required: [], properties: {} };
      }
      if (parameter.required) ans[key].required.push(parameter.name);
      ans[key].properties[parameter.name] = schemaToDraft04(schema);
    });
  }

  return ans;
}

function getFakeDataForSchema(schema, all) {
  const options = all
    ? { alwaysFakeOptionals: true, requiredOnly: false }
    : { alwaysFakeOptionals: false, requiredOnly: true };

  jsf.option(options);
  return jsf.generate(schema);
}

function generateFakeData(schemas, all) {
  return {
    params: (schemas.params && getFakeDataForSchema(schemas.params, all)) || {},
    headers:
      (schemas.headers && getFakeDataForSchema(schemas.headers, all)) || {},
    query: (schemas.query && getFakeDataForSchema(schemas.query, all)) || {},
    cookies:
      (schemas.cookies && getFakeDataForSchema(schemas.cookies, all)) || {},
    body: (schemas.body && getFakeDataForSchema(schemas.body, all)) || {}
  };
}

export default function fakeData(operation) {
  let mimeTypes = getMimeTypes(operation);
  if (!mimeTypes.length) mimeTypes = ['_default_'];

  const required = mimeTypes.reduce((acc, mimeType) => {
    const schemas = getSchemasForMimeType(operation, mimeType);
    acc[mimeType] = generateFakeData(schemas, false);
    return acc;
  }, {});

  const all = mimeTypes.reduce((acc, mimeType) => {
    const schemas = getSchemasForMimeType(operation, mimeType);
    acc[mimeType] = generateFakeData(schemas, true);
    return acc;
  }, {});

  return mimeTypes.length > 1
    ? { required, all, mimeTypes }
    : {
        required: required[mimeTypes[0]],
        all: all[mimeTypes[0]],
        mimeTypes: []
      };
}
