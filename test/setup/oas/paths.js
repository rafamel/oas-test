const TAG = 'todo';
const SCHEMA = 'Todo';

export default {
  [`/api/${TAG}`]: {
    get: {
      tags: [TAG],
      operationId: 'list' + SCHEMA,
      summary: 'list' + SCHEMA,
      parameters: [],
      responses: {
        200: { $ref: `#/components/responses/${SCHEMA}s` }
      },
      security: [{ bearerAuth: [] }]
    },
    post: {
      tags: [TAG],
      operationId: 'create' + SCHEMA,
      summary: 'create' + SCHEMA,
      parameters: [],
      requestBody: { $ref: `#/components/requestBodies/${SCHEMA}Create` },
      responses: {
        200: { $ref: `#/components/responses/${SCHEMA}` }
      },
      security: [{ bearerAuth: [] }]
    }
  },
  [`/api/${TAG}/{id}`]: {
    get: {
      tags: [TAG],
      operationId: 'show' + SCHEMA,
      summary: 'show' + SCHEMA,
      parameters: [{ $ref: '#/components/parameters/id' }],
      responses: {
        200: { $ref: `#/components/responses/${SCHEMA}` }
      },
      security: [{ bearerAuth: [] }]
    },
    put: {
      tags: [TAG],
      operationId: 'update' + SCHEMA,
      summary: 'update' + SCHEMA,
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
      requestBody: { $ref: `#/components/requestBodies/${SCHEMA}Create` },
      responses: {
        200: {
          description: 'Successful response',
          headers: {
            foo: {
              required: false,
              schema: {
                type: 'integer',
                minimum: 0
              }
            },
            bar: {
              required: true,
              schema: {
                type: 'string',
                minimum: 0
              }
            },
            foobar: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'string',
                    minimum: 0
                  }
                }
              }
            }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  }
};
