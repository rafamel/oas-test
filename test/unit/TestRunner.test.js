import TestRunner from '../../src';
import { STORE_SYMBOL } from '../../src/TestRunner';
import oas from '../setup/static-oas.json';
import deep from 'lodash.clonedeep';

describe(`Initial state`, () => {
  test(`oas & collection are null resolving promises`, async (done) => {
    const tr = new TestRunner();

    expect(tr[STORE_SYMBOL].oas).toBeInstanceOf(Promise);
    expect(tr[STORE_SYMBOL].collection).toBeInstanceOf(Promise);
    expect(await tr[STORE_SYMBOL].oas).toBe(null);
    expect(await tr[STORE_SYMBOL].collection).toBe(null);
    done();
  });
  test(`default settings.assert should assert`, () => {
    expect.assertions(1);
    const tr = new TestRunner();
    const assert = tr[STORE_SYMBOL].settings.assert;

    assert(true);
  });
  test(`default settings.errorHandler throws`, () => {
    const tr = new TestRunner();
    const errorHandler = tr[STORE_SYMBOL].settings.errorHandler;

    expect(() => errorHandler(Error())).toThrowError();
  });
  test(`hooks for data, response, request, are empty arrays`, () => {
    const tr = new TestRunner();

    expect(typeof tr[STORE_SYMBOL].hooks).toBe('object');
    expect(tr[STORE_SYMBOL].hooks.data).toEqual([]);
    expect(tr[STORE_SYMBOL].hooks.request).toEqual([]);
    expect(tr[STORE_SYMBOL].hooks.response).toEqual([]);
  });
});

describe(`tr.context`, () => {
  test(`tr.context is stored object`, () => {
    const tr = new TestRunner();
    expect(typeof tr.context).toBe('object');
    expect(tr.context).toBe(tr[STORE_SYMBOL].context);
  });
});

describe(`tr.load()`, () => {
  test(`loads all properties; sets collection; dereferences oas`, async (done) => {
    const tr = new TestRunner();
    const app = {};

    expect(() => tr.load({ app, url: 'url', oas })).not.toThrow();
    expect(tr[STORE_SYMBOL].app).toBe(app);
    expect(tr[STORE_SYMBOL].url).toBe('url');
    expect(tr[STORE_SYMBOL].oas).toBeInstanceOf(Promise);
    expect(tr[STORE_SYMBOL].collection).toBeInstanceOf(Promise);

    const trOas = await tr[STORE_SYMBOL].oas;
    const trCollection = await tr[STORE_SYMBOL].collection;

    expect(trOas).toMatchSnapshot();
    expect(trCollection).toMatchSnapshot();
    done();
  });
  test(`doesn't fail when no args are passed`, () => {
    const tr = new TestRunner();

    expect(() => tr.load()).not.toThrow();
  });
  test(`returns instance`, () => {
    const tr = new TestRunner();

    expect(tr.load()).toBe(tr);
    expect(tr.load({ app: {}, oas, url: 'url' })).toBe(tr);
  });
  test(`adding an OAS updates tr.promise`, async () => {
    expect.assertions(2);
    const tr = new TestRunner();

    const p1 = tr.promise;
    let time1, time2;
    tr.load({ url: 'url', oas });
    tr[STORE_SYMBOL].oas.then(() => (time1 = Date.now()));
    tr.promise.then(() => (time2 = Date.now()));

    await tr.promise;

    expect(tr.promise).not.toBe(p1);
    expect(time2).toBeGreaterThanOrEqual(time1);
  });
  test(`throws error (errorHandler) when oas is not valid`, async () => {
    expect.assertions(1);
    let err;
    const tr = new TestRunner().settings({ errorHandler: (e) => (err = e) });

    tr.load({ oas: { ...oas, invalidProp: true }, url: 'url' });

    await tr.promise.catch(() => {});
    expect(err).toBeInstanceOf(Error);
  });
  test(`overwrites values for null, preserves for undefined`, () => {
    const tr = new TestRunner().load({ app: 1, url: 2, oas });
    const pOas = tr[STORE_SYMBOL].oas;

    tr.load({});
    expect(tr[STORE_SYMBOL].app).toBe(1);
    expect(tr[STORE_SYMBOL].url).toBe(2);
    expect(tr[STORE_SYMBOL].oas).toBe(pOas);

    tr.load({ app: 3 });
    expect(tr[STORE_SYMBOL].app).toBe(3);
    expect(tr[STORE_SYMBOL].url).toBe(2);
    expect(tr[STORE_SYMBOL].oas).toBe(pOas);

    tr.load({ url: 4 });
    expect(tr[STORE_SYMBOL].app).toBe(3);
    expect(tr[STORE_SYMBOL].url).toBe(4);
    expect(tr[STORE_SYMBOL].oas).toBe(pOas);

    tr.load({ oas });
    expect(tr[STORE_SYMBOL].app).toBe(3);
    expect(tr[STORE_SYMBOL].url).toBe(4);
    expect(tr[STORE_SYMBOL].oas).not.toBe(pOas);
    expect(tr[STORE_SYMBOL].oas).toBeInstanceOf(Promise);
  });
});

describe(`tr.settings()`, () => {
  test(`merges settings`, () => {
    const tr = new TestRunner();
    const settings = deep(tr[STORE_SYMBOL].settings);
    const added = { assert: 1, describe: 2, test: 3, logger: 4 };
    tr.settings(added);
    expect(tr[STORE_SYMBOL].settings).toEqual({ ...settings, ...added });
  });
  test(`doesn't throw when no args are passed`, () => {
    const tr = new TestRunner();
    expect(() => tr.settings()).not.toThrow();
  });
  test(`returns instance`, () => {
    const tr = new TestRunner();
    expect(tr.settings()).toBe(tr);
    expect(tr.settings({})).toBe(tr);
  });
});

describe(`tr.hook()`, () => {
  test(`fails for invalid types, doesn't for valid types`, () => {
    const tr = new TestRunner();
    expect(() => tr.hook('response', () => {})).not.toThrow();
    expect(() => tr.hook('request', () => {})).not.toThrow();
    expect(() => tr.hook('data', () => {})).not.toThrow();
    expect(() => tr.hook('other', () => {})).toThrowError();
  });
  test(`returns instance`, () => {
    const tr = new TestRunner();
    expect(tr.hook('response', () => {})).toBe(tr);
    expect(tr.hook('request', () => {})).toBe(tr);
    expect(tr.hook('data', () => {})).toBe(tr);
  });
  test(`adds data hooks`, () => {
    const tr = new TestRunner();
    const a = () => {};
    const b = () => {};
    const c = () => {};

    tr.hook('data', a)
      .hook('data', b)
      .hook('data', c);

    expect(tr[STORE_SYMBOL].hooks.data).toEqual([a, b, c]);
  });
  test(`adds request hooks`, () => {
    const tr = new TestRunner();
    const a = () => {};
    const b = () => {};
    const c = () => {};

    tr.hook('request', a)
      .hook('request', b)
      .hook('request', c);

    expect(tr[STORE_SYMBOL].hooks.request).toEqual([a, b, c]);
  });
  test(`adds response hooks`, () => {
    const tr = new TestRunner();
    const a = () => {};
    const b = () => {};
    const c = () => {};

    tr.hook('response', a)
      .hook('response', b)
      .hook('response', c);

    expect(tr[STORE_SYMBOL].hooks.response).toEqual([a, b, c]);
  });
});

describe(`tr.clone()`, () => {
  test(`clones instance`, () => {
    const tr = new TestRunner();

    const a = () => {};
    const b = () => {};

    tr.load({ app: {}, url: '' })
      .hook('data', a)
      .hook('request', b);

    const cloned = tr.clone();

    expect(cloned).toBeInstanceOf(TestRunner);

    const trStore = { ...tr[STORE_SYMBOL], settings: {} };
    const clonedStore = { ...cloned[STORE_SYMBOL], settings: {} };

    expect({ ...trStore, assertlog: 1 }).toEqual({
      ...clonedStore,
      assertlog: 1
    });
    expect(trStore.assertlog).not.toBe(clonedStore.assertlog);
    expect(trStore.assertlog).toBeInstanceOf(Function);
    expect(clonedStore.assertlog).toBeInstanceOf(Function);

    tr.hook('response', () => {});
    expect(trStore).not.toEqual(clonedStore);
  });
});

describe(`tr.self()`, () => {
  test(`receives tr`, (done) => {
    const tr = new TestRunner();
    tr.self((tr2) => {
      expect(tr2).toBe(tr);
      done();
    });
  });
  test(`doesn't throw when no args are passed`, () => {
    const tr = new TestRunner();
    expect(() => tr.self()).not.toThrow();
  });
  test(`returns instance`, () => {
    const tr = new TestRunner();

    expect(tr.self()).toBe(tr);
    expect(tr.self(() => {})).toBe(tr);
  });
});

describe(`tr.test()`, () => {
  test(`doesn't throw when no args are passed`, () => {
    const tr = new TestRunner();
    expect(() => tr.load({ url: 'url' }).test()).not.toThrow();
    expect(() => tr.load({ url: 'url' }).test({})).not.toThrow();
  });
  test(`returns instance`, () => {
    const tr = new TestRunner();

    expect(tr.load({ url: 'url' }).test()).toBe(tr);
    expect(tr.load({ url: 'url' }).test({})).toBe(tr);
  });
  test(`throws when no url or app are passed`, () => {
    const tr = new TestRunner();

    expect(() => tr.load({ oas }).test()).toThrowError();
    expect(() => tr.load({}).test()).toThrowError();
    expect(() => tr.test()).toThrowError();
  });
  test(`doesn't throw when  url or app are passed`, () => {
    const tr = new TestRunner();

    expect(() => tr.load({ url: 'url' }).test()).not.toThrow();
    expect(() => tr.load({ app: {} }).test()).not.toThrow();
  });
});
