import validateSchema from './validate-schema';

export default function validateReponse(
  res,
  response,
  contentType,
  assertlog,
  taskDescription
) {
  if (!response.content) return;

  // Response is of one of the specified types
  const responseTypes = Object.keys(response.content);
  let responseType;
  for (let i = 0; i < responseTypes.length; i++) {
    if (contentType.includes(responseTypes[i])) {
      responseType = responseTypes[i];
      break;
    }
  }
  assertlog(
    !!responseType,
    `${taskDescription}: Response doesn't have an allowed content-type`
  );

  // Body is valid against schema
  const schema = response.content[responseType].schema;
  const { valid, errors } = validateSchema(schema, res.body);
  assertlog(
    !!valid,
    `${taskDescription}: Response body is not valid: ` + JSON.stringify(errors)
  );
}
