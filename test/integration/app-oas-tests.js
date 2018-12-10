export default function(rootTr, app, oas) {
  describe(`w/ app & oas`, () => {
    const getTr = (done) =>
      rootTr.clone().settings({ test: (_, cb) => cb(done) });

    const getValidateTr = (done, valid) => {
      let ans = true;
      return rootTr.clone().settings({
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

    test(`Throws (errorHandler) on non existent OAS operationId`, async () => {
      expect.assertions(1);
      let err;
      const tr = getTr(() => {}).settings({ errorHandler: (e) => (err = e) });

      tr.test({
        nonExistentEndpoint: {
          200: {
            response(res, info) {}
          }
        }
      });

      await tr.promise.catch(() => {});

      expect(err).toBeInstanceOf(Error);
    });

    test(`Throws (errorHandler) on non existent response statusCode`, async () => {
      expect.assertions(1);
      let err;
      const tr = getTr(() => {}).settings({
        assert: () => {},
        errorHandler: (e) => (err = e)
      });

      tr.test({
        listTodo: {
          555: {
            validate: 555
          }
        }
      });

      await tr.promise.catch(() => {});

      expect(err).toBeInstanceOf(Error);
    });

    test(`Calls response`, (done) => {
      expect.assertions(2);

      getTr(done).test({
        listTodo: {
          200: {
            response(res, info) {
              expect(typeof res).toBe('object');
              expect(res.body).toEqual({ data: 'response' });
            }
          }
        }
      });
    });

    test(`Adds base url`, (done) => {
      expect.assertions(1);

      getTr(done)
        .load({ app, oas, url: 'foo/bar' })
        .test({
          listTodo: {
            200: {
              response(res, info) {
                expect(res.body).toHaveProperty('foo', 'bar');
              }
            }
          }
        });
    });

    test(`validate: body should be invalid`, (done) => {
      expect.assertions(1);

      getValidateTr(done, false).test({
        listTodo: {
          200: {
            validate: 200
          }
        }
      });
    });

    test(`validate: body should be valid`, (done) => {
      expect.assertions(1);

      getValidateTr(done, true).test({
        listTodo: {
          200: {
            data(fake, info, task) {
              info.endpoint.path += '/200';
            },
            validate: 200
          }
        }
      });
    });

    test(`Generates fake data for header and body`, (done) => {
      expect.assertions(1);

      getTr(done).test({
        updateTodo: {
          200: {
            data(fake, info, task) {
              expect(fake).toMatchSnapshot();
              return fake.required;
            }
          }
        }
      });
    });
    test(`Callbacks receive all args`, (done) => {
      expect.assertions(8);
      const fromInfo = (info) => ({
        ...info,
        oas: null,
        endpoint: { ...info.endpoint, operation: null }
      });

      const tr = getTr(done);
      tr.test({
        updateTodo: {
          200: {
            data(fake, info, task) {
              expect(info.context).toBe(tr.context);
              expect(fake).toMatchSnapshot();
              expect(fromInfo(info)).toMatchSnapshot();
              expect(task).toMatchSnapshot();
              return fake.required;
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
    test(`response headers: fail`, (done) => {
      getValidateTr(done, false).test({
        updateTodo: {
          200: {
            data: { params: { id: 1 } },
            validate: 200
          }
        }
      });
    });
    test(`response headers: pass`, (done) => {
      getValidateTr(done, true).test({
        updateTodo: {
          200: {
            data(fake) {
              return fake.required;
            },
            validate: 200
          }
        }
      });
    });
    test(`sends fake data by default`, (done) => {
      getValidateTr(done, true).test({
        updateTodo: {
          200: {
            validate: 200
          }
        }
      });
    });
  });
}
