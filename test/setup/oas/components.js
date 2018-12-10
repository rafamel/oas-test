import * as Todo from './models/Todo';

export default {
  schemas: {
    ...Todo.schemas
  },
  requestBodies: {
    ...Todo.requests
  },
  responses: {
    ...Todo.responses
  },
  parameters: {
    id: {
      name: 'id',
      in: 'path',
      description: 'ID of the item to return',
      required: true,
      schema: { type: 'integer', minimum: 0 }
    }
  },
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT', // optional, for documentation purposes
      description:
        'User access token as header bearer token (Authorization: Bearer access_token)'
    }
  },
  examples: {},
  headers: {},
  links: {},
  callbacks: {}
};
