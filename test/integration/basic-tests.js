export default function(rootTr) {
  describe(`Basic`, () => {
    const tr = rootTr.clone();

    test(`Calls describe, test, assert`, async (done) => {
      const called = { assert: 0, describe: 0, done: 0, test: 0 };

      await new Promise((resolve, reject) => {
        const assertFn = () => (called.assert += 1);
        const describeFn = (name, cb) => {
          cb();
          called.describe += 1;
          expect(name).toBe('listTodo');
        };
        const doneFn = () => (called.done += 1);
        const testFn = (name, cb) => {
          const ans = cb(doneFn);
          called.test += 1;

          expect(name).toBe('200');
          expect(ans).toBeInstanceOf(Promise);

          if (ans instanceof Promise) {
            ans.then((x) => resolve(x)).catch((x) => reject(x));
          } else resolve();
        };

        tr.clone()
          .settings({
            assert: assertFn,
            describe: describeFn,
            test: testFn
          })
          .test({
            listTodo: {
              200: {
                validate: 200
              }
            }
          });
      });

      expect(called.assert).toBeGreaterThanOrEqual(1);
      expect(called.describe).toBe(1);
      expect(called.test).toBe(1);
      expect(called.done).toBe(1);
      done();
    });
  });
}
