import validateSchema from '../../../src/validate/validate-schema';

const schema = {
  type: 'object',
  required: ['username', 'email'],
  properties: {
    username: {
      type: 'string',
      minLength: 6,
      maxLength: 16,
      pattern: '^[a-zA-Z0-9_]+$'
    },
    password: {
      type: 'string',
      minLength: 8,
      maxLength: 20,
      pattern: '^[a-zA-Z0-9_]+$'
    },
    email: {
      type: 'string',
      format: 'email'
    }
  }
};

test(`Shouldn't have errors`, () => {
  const ans = validateSchema(schema, {
    username: 'myusername',
    email: 'thisis@anEmail.com'
  });
  expect(ans.valid).toBe(true);
  expect(ans.errors).toBe(null);
});
test(`Should have errors`, () => {
  const ans1 = validateSchema(schema, {
    username: 'myusername',
    password: 'gua',
    email: 'thisis@anEmail.com'
  });
  const ans2 = validateSchema(schema, {
    username: 'myusername',
    password: 'mypassword'
  });

  expect(ans1.valid).toBe(false);
  expect(ans1.errors).toMatchInlineSnapshot(`
Array [
  Object {
    "dataPath": ".password",
    "keyword": "minLength",
    "message": "should NOT be shorter than 8 characters",
    "params": Object {
      "limit": 8,
    },
    "schemaPath": "#/properties/password/minLength",
  },
]
`);

  expect(ans2.valid).toBe(false);
  expect(ans2.errors).toMatchInlineSnapshot(`
Array [
  Object {
    "dataPath": "",
    "keyword": "required",
    "message": "should have required property 'email'",
    "params": Object {
      "missingProperty": "email",
    },
    "schemaPath": "#/required",
  },
]
`);
});
test(`Informs of multiple errors`, () => {
  const ans = validateSchema(schema, {
    username: 'myusername',
    password: 'my'
  });

  expect(ans.valid).toBe(false);
  expect(ans.errors).toMatchInlineSnapshot(`
Array [
  Object {
    "dataPath": ".password",
    "keyword": "minLength",
    "message": "should NOT be shorter than 8 characters",
    "params": Object {
      "limit": 8,
    },
    "schemaPath": "#/properties/password/minLength",
  },
]
`);
});
