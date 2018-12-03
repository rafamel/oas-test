import validateSchema from './validate-schema';

function validateHeader(
  res,
  name,
  header,
  contentType,
  assertlog,
  taskDescription
) {
  // If required, it must exist
  if (header.required) {
    assertlog(
      res.header.hasOwnProperty(name),
      `${taskDescription}: Response header doesn't have required "${name}"`
    );
  }
  if (!res.header.hasOwnProperty(name)) return;

  // If it exists, and it has a content property, it must have a defined type
  let headerSchema = header.schema;
  if (header.content) {
    const headerTypes = Object.keys(header.content);
    let headerType;
    for (let i = 0; i < headerTypes.length; i++) {
      if (contentType.includes(headerTypes[i])) {
        headerType = headerTypes[i];
        break;
      }
    }
    assertlog(
      !!headerType,
      `${taskDescription}: Response doesn't have an allowed content-type for header "${name}"`
    );
    headerSchema = header.content[headerType];
  }

  // Header prop is valid against schema
  const { valid, errors } = validateSchema(headerSchema, res.header[name]);
  assertlog(
    !!valid,
    `${taskDescription}: Response header "${name}" is not valid: ` +
      JSON.stringify(errors)
  );
}

export default function validateHeaders(
  res,
  response,
  contentType,
  assertlog,
  taskDescription
) {
  // Validate response headers
  if (!response.headers) return;
  Object.entries(response.headers).forEach(([name, header]) =>
    validateHeader(
      res,
      name.toLowerCase(),
      header,
      contentType,
      assertlog,
      taskDescription
    )
  );
}
