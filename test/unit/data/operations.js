const singleMime = {
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: {
        type: 'integer',
        minimum: 0
      }
    },
    {
      name: 'name',
      in: 'query',
      required: false,
      schema: {
        type: 'integer',
        minimum: 0
      }
    },
    {
      name: 'some',
      in: 'header',
      required: true,
      schema: {
        type: 'string'
      }
    },
    {
      name: 'aCookie',
      in: 'cookie',
      required: false,
      schema: {
        type: 'string'
      }
    }
  ],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['username', 'password'],
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
        }
      }
    },
    required: true
  }
};

const multipleMimes = {
  ...singleMime,
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: {
        type: 'integer',
        minimum: 0
      }
    },
    {
      name: 'name',
      in: 'query',
      required: false,
      content: {
        'application/xml': {
          schema: {
            type: 'string'
          }
        },
        'application/json': {
          schema: {
            type: 'number'
          }
        }
      }
    },
    {
      name: 'some',
      in: 'header',
      required: true,
      content: {
        'application/xml': {
          schema: {
            type: 'string'
          }
        },
        'application/json': {
          schema: {
            type: 'number'
          }
        }
      }
    }
  ],
  requestBody: {
    ...singleMime.requestBody,
    content: {
      ...singleMime.requestBody.content,
      'application/xml': {
        schema: {
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
        }
      }
    }
  }
};

export default {
  singleMime: {
    noParams: {
      ...singleMime,
      parameters: undefined // No params as undefined
    },
    noBody: {
      ...singleMime,
      requestBody: {}
    },
    all: singleMime
  },
  multipleMimes: {
    noParams: {
      ...multipleMimes,
      parameters: [] // No params as empty array
    },
    noBody: {
      ...multipleMimes,
      requestBody: {}
    },
    all: multipleMimes
  }
};
