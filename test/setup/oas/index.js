import paths from './paths';
import components from './components';
import pkg from '~/../package.json';

export default {
  openapi: '3.0.0',
  servers: [],
  info: {
    version: pkg.version,
    title: pkg.description,
    description: `${pkg.description} OAS 3 specification.`,
    license: { name: pkg.license }
  },
  tags: [{ name: 'user', description: 'User operations' }],
  paths,
  components,
  security: []
  // externalDocs
};
