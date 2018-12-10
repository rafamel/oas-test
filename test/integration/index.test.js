import TestRunner from '../../src';
import app from '../setup/app';
import oas from '../setup/oas';
import jsf from 'json-schema-faker';
import basicTests from './basic-tests';
import appTests from './app-tests';
import appOasTests from './app-oas-tests';

// Set randomness generator for faker as constant
jsf.option({ random: () => 0.5 });

const rootTr = new TestRunner().load({ app, oas }).settings({
  logger: { log: () => {} },
  describe: (_, cb) => cb(),
  test: (_, cb) => cb()
});

basicTests(rootTr);
appTests(rootTr, app);
appOasTests(rootTr, app, oas);
