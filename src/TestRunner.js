import deep from 'lodash.clonedeep';
// sync alternative: json-ref-lite
import $RefParser from 'json-schema-ref-parser';
import SwaggerParser from 'swagger-parser';
import chalk from 'chalk';
import collect from './collect';

export const STORE_SYMBOL = Symbol('store');

export default class TestRunner {
  constructor() {
    this._first = false;
    this[STORE_SYMBOL] = {
      app: null,
      url: null,
      settings: {
        assert: (bool) => expect(bool).toBe(true),
        describe: describe,
        test: test,
        logger: console,
        logall: false
      },
      hooks: {
        data: [],
        request: [],
        response: []
      },
      context: {},
      oas: Promise.resolve(null),
      collection: Promise.resolve(null),
      assertlog: (condition, description) => {
        const { settings } = this[STORE_SYMBOL];
        if (
          settings.logger &&
          !condition &&
          (settings.logall || !this._first)
        ) {
          this._first = true;
          settings.logger.log(chalk.red(description));
        }
        settings.assert(condition);
      }
    };
  }
  get context() {
    return this[STORE_SYMBOL].context;
  }
  load({ app, url, oas } = {}) {
    this[STORE_SYMBOL].app = app || null;
    this[STORE_SYMBOL].url = url || null;

    if (oas) {
      // Dereference and validate oas
      const promise = Promise.resolve(oas)
        .then((oas) => $RefParser.dereference(deep(oas)))
        .then((oas) => SwaggerParser.validate(oas))
        .catch((e) => {
          throw e;
        });
      this[STORE_SYMBOL].oas = promise;
      this[STORE_SYMBOL].collection = promise.then(collect);
    } else {
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

    return this;
  }
}
