import Ajv from 'ajv';
import ajvDraft04 from 'ajv/lib/refs/json-schema-draft-04.json';
import schemaToDraft04 from 'openapi-schema-to-json-schema';

// AJV settings for Draft04
const ajv = new Ajv({ schemaId: 'id', logger: false });
ajv.addMetaSchema(ajvDraft04);

export default function validateSchema(schema, data) {
  schema = schemaToDraft04(schema);

  const ajvValidate = ajv.compile(schema);
  const valid = ajvValidate(data);

  return {
    valid,
    errors: valid ? null : ajvValidate.errors
  };
}
