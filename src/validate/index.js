import validateResponse from './validate-response';
import validateHeaders from './validate-headers';

export default function validate(store, validateCode, res, info) {
  const { assertlog } = store;
  const taskDescription = `${info.id} > ${info.name}`;
  const endpoint = info.endpoint;

  // Response has valid status code
  assertlog(
    // eslint-disable-next-line eqeqeq
    res.statusCode == validateCode,
    `${taskDescription}: Response doesn't have ${validateCode} status code: ${
      res.statusCode
    }`
  );

  // End validation if we don't have an OAS definition
  if (!endpoint.operation) return;

  const contentType = res.header['content-type'];
  const responses = endpoint.operation.responses;

  if (!responses.hasOwnProperty(validateCode)) {
    throw Error(
      `${taskDescription}: There's no definition for response ${validateCode}`
    );
  }

  // Response has content type
  assertlog(
    !!contentType,
    `${taskDescription}: Response doesn't have a content-type`
  );

  const response = responses[validateCode];

  validateResponse(res, response, contentType, assertlog, taskDescription);
  validateHeaders(res, response, contentType, assertlog, taskDescription);
}
