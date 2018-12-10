import getData, { paramsToPath, requestData } from '../../../src/data';
import operations from './operations';
import jsf from 'json-schema-faker';

// Set randomness generator for faker as constant
jsf.option({ random: () => 0.5 });

describe(`getData()`, () => {
  test(`Returns fake required data for task.data = true`, async (done) => {
    const data = await getData(
      { data: [] }, // hooks
      { data: true }, // task
      {}, // info
      operations.singleMime.noParams // operation
    );

    expect(data).toMatchSnapshot();
    done();
  });
  test(`Doesn't return any data for task.data = false`, async (done) => {
    const data = await getData(
      { data: [] }, // hooks
      { data: false }, // task
      {}, // info
      operations.singleMime.noParams // operation
    );

    expect(data).toBe(null);
    done();
  });
  test(`Returns object when object`, async (done) => {
    const obj = { ex: 1 };
    const data = await getData(
      { data: [] }, // hooks
      { data: obj }, // task
      {}, // info
      operations.singleMime.noParams // operation
    );

    expect(data).toBe(obj);
    done();
  });
  test(`Calls function for functions`, async (done) => {
    const obj = { ex: 1 };
    const data = await getData(
      { data: [] }, // hooks
      { data: () => obj }, // task
      {}, // info
      operations.singleMime.noParams // operation
    );

    expect(data).toBe(obj);
    done();
  });
  test(`Calls function for functions (async)`, async (done) => {
    const obj = { ex: 1 };
    const data = await getData(
      { data: [] }, // hooks
      { data: async () => obj }, // task
      {}, // info
      operations.singleMime.noParams // operation
    );

    expect(data).toBe(obj);
    done();
  });
  test(`Calls all hooks in order, returns last`, async (done) => {
    const hooksR = [];
    const obj = { ex: 1 };
    const data = await getData(
      {
        data: [
          () => hooksR.push(1),
          () => hooksR.push(2),
          () => hooksR.push(3) && obj
        ]
      }, // hooks
      { data: () => {} }, // task
      {}, // info
      operations.singleMime.noParams // operation
    );

    expect(data).toBe(obj);
    expect(hooksR).toEqual([1, 2, 3]);
    done();
  });
  test(`Calls all hooks in order, returns last (async)`, async (done) => {
    const hooksR = [];
    const obj = { ex: 1 };
    const data = await getData(
      {
        data: [
          async () => hooksR.push(1),
          async () => hooksR.push(2),
          async () => hooksR.push(3) && obj
        ]
      }, // hooks
      { data: async () => {} }, // task
      {}, // info
      operations.singleMime.noParams // operation
    );

    expect(data).toBe(obj);
    expect(hooksR).toEqual([1, 2, 3]);
    done();
  });
  test(`Complete functionality`, async (done) => {
    const infoObj = {};
    const taskObj = {
      data: async (fake, info, task) => {
        expect(fake).toHaveProperty('mimeTypes');
        expect(info).toBe(infoObj);
        expect(task).toBe(taskObj);
        return 1;
      }
    };
    const data = await getData(
      {
        data: [
          async (data, fake, info, task) => {
            expect(data).toBe(1);
            expect(fake).toHaveProperty('mimeTypes');
            expect(info).toBe(infoObj);
            expect(task).toBe(taskObj);
            return data + 1;
          },
          async (data, fake, info, task) => {
            expect(data).toBe(2);
            expect(fake).toHaveProperty('mimeTypes');
            expect(info).toBe(infoObj);
            expect(task).toBe(taskObj);
            return data + 1;
          },
          async (data, fake, info, task) => {
            expect(data).toBe(3);
            expect(fake).toHaveProperty('mimeTypes');
            expect(info).toBe(infoObj);
            expect(task).toBe(taskObj);
            return data + 1;
          }
        ]
      }, // hooks
      taskObj, // task
      infoObj, // info
      operations.singleMime.noParams // operation
    );

    expect(data).toBe(4);
    done();
  });
  test(`Doesn't pass fake if there's no operation object`, async (done) => {
    await getData(
      { data: [] }, // hooks
      {
        data: (fake) => {
          expect(fake).toBe(null);
        }
      }, // task
      {}, // info
      null
    );
    done();
  });
});

describe(`paramsToPath()`, () => {
  test(`Returns same path if no params`, () => {
    const base = '/this/is/a/path';
    const path1 = paramsToPath(base, null);
    const path2 = paramsToPath(base, {});
    const path3 = paramsToPath(base, { params: null });
    const path4 = paramsToPath(base, { params: {} });

    expect(path1).toBe(base);
    expect(path2).toBe(base);
    expect(path3).toBe(base);
    expect(path4).toBe(base);
  });
  test(`Returns path with params if params`, () => {
    const base = '/this/{id}/a/{name}';
    const path = paramsToPath(base, { params: { id: 1, name: 'hi' } });

    expect(path).toBe('/this/1/a/hi');
  });
  test(`Throws if data param not in path`, () => {
    const base = '/this/is/a/{name}';
    const getPath = () => paramsToPath(base, { params: { id: 1, name: 'hi' } });

    expect(getPath).toThrowError();
  });
  test(`Throws if path param not in data`, () => {
    const base = '/this/{id}/a/{name}';
    const getPath1 = () => paramsToPath(base, { params: { name: 'hi' } });
    const getPath2 = () => paramsToPath(base, { params: null });
    const getPath3 = () => paramsToPath(base, {});
    const getPath4 = () => paramsToPath(base, null);

    expect(getPath1).toThrowError();
    expect(getPath2).toThrowError();
    expect(getPath3).toThrowError();
    expect(getPath4).toThrowError();
  });
});

describe(`requestData()`, () => {
  test(`Doesn't throw for no data`, () => {
    expect(() => requestData()).not.toThrow();
  });
  test(`Works for headers`, () => {
    const headers = {};
    const req = {
      set(key, value) {
        headers[key] = value;
      }
    };
    const data = {
      headers: { id: 1, name: 'hi' }
    };
    requestData(req, data);

    expect(headers).toEqual(data.headers);
  });
  test(`Works for headers and cookies`, () => {
    const headers = {};
    const req = {
      set(key, value) {
        headers[key] = value;
      }
    };
    const data = {
      headers: { id: 1, name: 'hi' },
      cookies: { one: 'say', two: 'hello' }
    };
    requestData(req, data);

    expect(headers).toEqual({
      ...data.headers,
      Cookie: 'one=say;two=hello;'
    });
  });
  test(`Works for query`, () => {
    let query = {};
    const req = {
      query(_query) {
        query = _query;
      }
    };
    const data = {
      query: { some: 'query' }
    };
    requestData(req, data);

    expect(query).toEqual(data.query);
  });
  test(`Works for all`, () => {
    const headers = {};
    let query = {};
    const req = {
      set(key, value) {
        headers[key] = value;
      },
      query(_query) {
        query = _query;
      }
    };
    const data = {
      headers: { id: 1, name: 'hi' },
      cookies: { one: 'say', two: 'hello' },
      query: { some: 'query' }
    };
    requestData(req, data);

    expect(headers).toEqual({
      ...data.headers,
      Cookie: 'one=say;two=hello;'
    });
    expect(query).toEqual(data.query);
  });
});
