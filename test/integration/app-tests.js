export default function(rootTr, app) {
  describe(`w/ app`, () => {
    const getTr = (done) =>
      rootTr
        .clone()
        .settings({ test: (_, cb) => cb(done) })
        .load({ oas: null });

    const getValidateTr = (done, valid) => {
      let ans = true;
      return rootTr
        .clone()
        .load({ oas: null })
        .settings({
          assert: (bool) => ans && (ans = bool),
          test: (_, cb) => {
            // eslint-disable-next-line standard/no-callback-literal
            return cb(() => {
              expect(ans).toBe(valid);
              done();
            });
          }
        });
    };

    test(`Throws (errorHandler) on badly defined path`, async () => {
      expect.assertions(1);
      let err;
      const tr = getTr(() => {}).settings({ errorHandler: (e) => (err = e) });

      tr.test({
        'get/api/wappwooas': {
          200: {
            response(res) {}
          }
        }
      });

      await tr.promise.catch(() => {});

      expect(err).toBeInstanceOf(Error);
    });

    test(`Calls response`, (done) => {
      expect.assertions(2);

      getTr(done).test({
        'get:/api/wappwooas': {
          200: {
            response(res) {
              expect(typeof res).toBe('object');
              expect(res.body).toEqual({ data: 'response' });
            }
          }
        }
      });
    });

    test(`Promise doesn't resolve until all tests have finalized`, async () => {
      expect.assertions(3);

      const tr = getTr(() => {});
      tr.test({
        'get:/api/wappwooas': {
          200: {
            response(res) {
              expect(typeof res).toBe('object');
              expect(res.body).toEqual({ data: 'response' });
            }
          }
        },
        'get:/api/nonExistent': {
          404: {
            response(res) {
              expect(res.statusCode).toBe(404);
            }
          }
        }
      });

      await tr.promise;
    });

    test(`Calls request`, async (done) => {
      expect.assertions(1);

      getTr(done).test({
        'get:/api/wappwooas': {
          200: {
            request(req) {
              expect(typeof req.set).toBe('function');
            }
          }
        }
      });
    });

    test(`Sends data`, (done) => {
      expect.assertions(5);

      getTr(done).test({
        'post:/api/wappwooas/{end}': {
          200: {
            data: {
              params: { end: 'data' },
              query: { qfoo: 1 },
              body: { bfoo: 2 },
              headers: { hello: 1 },
              cookies: { one: 1, two: 2 }
            },
            response({ body }) {
              expect(body).toHaveProperty('query', { qfoo: '1' });
              expect(body).toHaveProperty('body', { bfoo: 2 });
              expect(body).toHaveProperty('headers');
              expect(body.headers).toHaveProperty('hello', '1');
              expect(body.headers).toHaveProperty('cookie', 'one=1;two=2;');
            }
          }
        }
      });
    });

    test(`Adds base url w/ slash`, (done) => {
      expect.assertions(1);

      getTr(done)
        .load({ app, url: '/foo/bar' })
        .test({
          'get:/api/wappwooas': {
            200: {
              response(res) {
                expect(res.body).toHaveProperty('foo', 'bar');
              }
            }
          }
        });
    });

    test(`Adds base url wo/ slash`, (done) => {
      expect.assertions(1);

      getTr(done)
        .load({ app, url: 'foo/bar' })
        .test({
          'get:/api/wappwooas': {
            200: {
              response(res, info) {
                expect(res.body).toHaveProperty('foo', 'bar');
                done();
              }
            }
          }
        });
    });

    test(`Callbacks receive all args`, (done) => {
      expect.assertions(7);
      const fromInfo = (info) => ({
        ...info,
        oas: null,
        endpoint: { ...info.endpoint, operation: null }
      });

      const tr = getTr(done);
      tr.test({
        'get:/api/wappwooas': {
          200: {
            data(_, info, task) {
              expect(info.context).toBe(tr.context);
              expect(fromInfo(info)).toMatchSnapshot();
              expect(task).toMatchSnapshot();
            },
            response(_, info, task) {
              expect(fromInfo(info)).toMatchSnapshot();
              expect(task).toMatchSnapshot();
            },
            request(_, info, task) {
              expect(fromInfo(info)).toMatchSnapshot();
              expect(task).toMatchSnapshot();
            }
          }
        }
      });
    });

    test(`Validates response code: fails`, (done) => {
      getValidateTr(done, false).test({
        'get:/api/wappwooas': {
          200: {
            validate: 400
          }
        }
      });
    });

    test(`Validates response code: succeeds`, (done) => {
      getValidateTr(done, true).test({
        'get:/api/wappwooas': {
          200: {
            validate: 200
          }
        }
      });
    });

    test(`Order of execution`, (done) => {
      expect.assertions(10);

      let i = 0;
      getValidateTr(done, false)
        .hook('data', () => expect(i++).toBe(1))
        .hook('request', () => expect(i++).toBe(3))
        .hook('response', () => expect(i++).toBe(6))
        .hook('response', () => expect(i++).toBe(7))
        .hook('request', () => expect(i++).toBe(4))
        .hook('data', () => expect(i++).toBe(2))
        .test({
          'get:/api/wappwooas': {
            200: {
              data() {
                expect(i++).toBe(0);
              },
              request() {
                expect(i++).toBe(5);
              },
              response() {
                expect(i++).toBe(8);
              },
              validate: 400
            }
          }
        });
    });
  });
}
