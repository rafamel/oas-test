const SCHEMA = 'Todo';
export const schemas = {
  [SCHEMA]: {
    type: 'object',
    required: ['name', 'done', 'user_id', 'created_at', 'id'],
    properties: {
      id: { type: 'integer', minimum: 0 },
      name: { type: 'string', minLength: 1, maxLength: 255 },
      done: { type: 'boolean' }
    }
  }
};

export const requests = {
  [SCHEMA + 'Create']: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['name', 'done'],
          properties: {
            name: schemas[SCHEMA].properties.name,
            done: schemas[SCHEMA].properties.done
          }
        }
      }
    },
    required: true
  },
  [SCHEMA + 'Patch']: {
    content: {
      'application/json': {
        schema: {
          type: 'object',
          minProperties: 1,
          properties: {
            name: schemas[SCHEMA].properties.name,
            done: schemas[SCHEMA].properties.done
          }
        }
      }
    },
    required: true
  }
};

export const responses = {
  [SCHEMA]: {
    description: 'Sucessful response',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['status', 'data'],
          properties: {
            status: { type: 'string', enum: ['success'] },
            data: {
              $ref: `#/components/schemas/${SCHEMA}`
            }
          }
        }
      }
    }
  },
  [SCHEMA + 's']: {
    description: 'Sucessful response',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['status', 'data'],
          properties: {
            status: { type: 'string', enum: ['success'] },
            data: {
              type: 'array',
              items: { $ref: `#/components/schemas/${SCHEMA}` }
            }
          }
        }
      }
    }
  }
};
