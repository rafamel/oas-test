import deep from 'lodash.clonedeep';
import assert from 'assert';
// sync alternative: json-ref-lite
import $RefParser from 'json-schema-ref-parser';
import SwaggerParser from 'swagger-parser';
import chalk from 'chalk';
import collect from './collect';
import generate from './generate';

export const STORE_SYMBOL = Symbol('store');

function createAssertLog({ settings }) {
  let first = false;
  return function assertlog(condition, description) {
    if (settings.logger && !condition && (settings.logall || !first)) {
      first = true;
      settings.logger.log(chalk.red(description));
    }
    settings.assert(condition);
  };
}

export default class TestRunner {
  constructor() {
    this.promise = Promise.resolve();
    this[STORE_SYMBOL] = {
      app: null,
      url: null,
      settings: {
        assert: (bool) =>
          (global.expect && global.expect(bool).toBe(true)) || assert,
        describe: global.describe || ((_, cb) => cb()),
        test: global.test || ((_, cb) => cb()),
        logger: console,
        logall: false,
        errorHandler: (err) => {
          throw err;
        }
      },
      hooks: {
        data: [],
        request: [],
        response: []
      },
      context: {},
      oas: Promise.resolve(null),
      collection: Promise.resolve(null)
    };
    this[STORE_SYMBOL].assertlog = createAssertLog(this[STORE_SYMBOL]);
  }
  get context() {
    return this[STORE_SYMBOL].context;
  }
  load({ app, url, oas } = {}) {
    if (app !== undefined) this[STORE_SYMBOL].app = app || null;
    if (url !== undefined) this[STORE_SYMBOL].url = url || null;

    if (oas) {
      // Dereference and validate oas
      const promise = Promise.resolve(oas)
        .then((oas) => $RefParser.dereference(deep(oas)))
        .then((oas) => SwaggerParser.validate(oas));

      this[STORE_SYMBOL].oas = promise.catch(() => {});
      this[STORE_SYMBOL].collection = promise.then(collect).catch(() => {});

      promise.catch((err) => this[STORE_SYMBOL].settings.errorHandler(err));
      this.promise = this.promise.then(() => promise.then(() => {}));
    } else if (oas !== undefined) {
      this[STORE_SYMBOL].oas = Promise.resolve(null);
      this[STORE_SYMBOL].collection = Promise.resolve(null);
    }

    return this;
  }
  settings(obj = {}) {
    Object.assign(this[STORE_SYMBOL].settings, obj);
    return this;
  }
  hook(type, cb) {
    const hookTypes = ['data', 'request', 'response'];
    if (!hookTypes.includes(type)) {
      throw Error(`Hooks can only be of types ${hookTypes.join(', ')}.`);
    }
    this[STORE_SYMBOL].hooks[type].push(cb);
    return this;
  }
  clone() {
    const testRunner = new TestRunner();
    testRunner[STORE_SYMBOL] = deep(this[STORE_SYMBOL]);
    testRunner[STORE_SYMBOL].assertlog = createAssertLog(
      testRunner[STORE_SYMBOL]
    );
    return testRunner;
  }
  self(cb) {
    // eslint-disable-next-line standard/no-callback-literal
    if (cb) cb(this);
    return this;
  }
  test(tests = {}) {
    const store = this[STORE_SYMBOL];

    if (!store.app && !store.url) {
      throw Error(
        "TestRunner.load() hasn't been called with a valid app, url, or both"
      );
    }

    const p = generate(store, tests).catch((err) => {
      return store.settings.errorHandler(err);
    });
    this.promise = this.promise.then(() => p);

    return this;
  }
}
