# oas-test

[![Version](https://img.shields.io/github/package-json/v/rafamel/oas-test.svg)](https://github.com/rafamel/oas-test)
[![Build Status](https://travis-ci.org/rafamel/oas-test.svg)](https://travis-ci.org/rafamel/oas-test)
[![Coverage](https://img.shields.io/coveralls/rafamel/oas-test.svg)](https://coveralls.io/github/rafamel/oas-test)
[![Dependencies](https://david-dm.org/rafamel/oas-test/status.svg)](https://david-dm.org/rafamel/oas-test)
[![Vulnerabilities](https://snyk.io/test/npm/oas-test/badge.svg)](https://snyk.io/test/npm/oas-test)
[![Issues](https://img.shields.io/github/issues/rafamel/oas-test.svg)](https://github.com/rafamel/oas-test/issues)
[![License](https://img.shields.io/github/license/rafamel/oas-test.svg)](https://github.com/rafamel/oas-test/blob/master/LICENSE)

<!-- markdownlint-disable MD036 -->
**Powerful OpenAPI 3.0 API testing, simplified.**
<!-- markdownlint-enable MD036 -->

## Install

[`npm install -D oas-test`](https://www.npmjs.com/package/oas-test)

**This library is configured to use *Jest* by default** (see [TestRunner.settings()](#TestRunnersettingssettings-TestRunner) to use with other testing suites); install *Jest* via `npm install -D jest-cli`

## Basic Usage

Define your tests as follows and run `jest index.test.js`.

File: `index.test.js`

```javascript
import app from '../src/app.js'; // Let's assume app.js exports an Express app
import myOpenApiDoc from '../docs/oas.json'; // and oas.json is an Open API 3 doc
import TestRunner from 'oas-test';
import userTests from './user-tests.js';

// Let's tell Jest to stop the Express app after all tests have run
afterAll(() => app.close());

new TestRunner()
  // You can pass a url instead of the express app, see TestRunner.load()
  .load({ app, oas: myOpenApiDoc })
  // Let's define a hook so all requests for endpoints/operations
  // that are defined in the OAS Document as having Bearer auth
  // and are not testing for unauthorized errors (401)
  // get sent a valid authorization token
  .hook('request', (req, info, task) => {
    if (task.validate === Number(401)) return; // See task object docs

    const { security } = info.endpoint.operation; // See info object docs
    if (!security) return;
    const hasAuth = security.filter(x => x.hasOwnProperty('bearerAuth')).length;
    if (hasAuth.length) req.set('Authorization', 'Bearer SOME_ACCESS_TOKEN');
  })
  .self(userTests);
```

File: `user-tests.js`

```javascript
import { merge } from 'oas-test';

export default function userTests(tr) {
  tr.test({
    // Key must match one of OAS operationIDs
    createUser: {
      // Key is a task name (discretionary)
      "Should be a valid response": {
        data(fake, info, task) {
          // Return fake data with a specific username in body
          // for required fields on first iteration
          return (info.iteration === 0)
            ? merge(fake.required, { body: { username: 'test-user' } })
            : fake.required;
        },
        // Validate response OAS schema for response 200,
        validate: 200,
        repeat: 2
      },
      "Should be a fields validation error": {
        // Sending request with deep merged data for required fields
        data(fake, info, task) {
          return merge(fake.required, {
            body: {
              password: 'invalid_password'
            }
          })
        },
        validate: 400
      }
    }
  })
  // We guarantee execution order defining the tasks below in a new
  // call to instance.test(); if execution order was irrelevant,
  // we'd define them in the same call. This way they ones below will be
  // executed after the ones above.
  .test({
    createUser: {
      "Should be a database validation error": {
        data(fake, info, task) {
          // Should not allow to create the same user twice
          return merge(fake.required, { body: { username: 'test-user' } });
        },
        validate: 400
      },
    },
    showUserByName: {
      data: { query: { username: 'test-user' } },
      validate: 200
    },
    listUsers: {
      response(res, info, task) {
        // Let's use our test suite (in this case Jest) directly
        // to verify some specifics of the response
        expect(res.body.users).toHaveLength(3);
      },
      validate: 200
    }
  });
}
```

## `TestRunner`

### `TestRunner.context`

Initialized as an empty *object,* accessible to all tasks as [`info.context`.](#info-object)

### `TestRunner.load(config): TestRunner`

* `config`: *object,* with optional properties:
  * `app`: *object, optional,* an Express application object.
  * `url`: *string, optional,* a complete URL if no `app` is passed, or the *base path* for the API if one is. **Only optional if `app` is passed.**
  * `oas`: *(object | Promise\<object\>), optional,* an [OAS Document](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#oasDocument) or a promise that resolves in one. If present, it will be [validated](https://github.com/APIDevTools/swagger-parser) and [dereferenced](https://www.npmjs.com/package/json-schema-ref-parser) before any test is run (see [`info.oas`](#info-object)).

If the object has already been `load`ed with an `app`, `url`, or `oas` (which will probably be the case for your [`clone`d instances](#TestRunnerclone-TestRunner)), when calling `load()` again, if properties are `undefined`, the previous value will be mantained; if they are `null` or otherwise provide any other new value, they'll be overwritten.

### `TestRunner.settings(settings): TestRunner`

* `settings`: *object,* with optional properties:
  * `assert`: *function,* called on test assertions.
  * `describe`: *function,* called to group tests; must have signature `(name: string, callback: function)`.
  * `test`: *function,* called on each test definition; must have signature `(name: string, callback: function)`. **Must support async behavior** in at least one of the following ways:
    * `callback` gets passed a `done` function to be called when the test has finished as its first argument ([example](https://jestjs.io/docs/en/asynchronous#callbacks)).
    * `callback` can return a promise to signal the test has finished ([example](https://jestjs.io/docs/en/asynchronous#promises)).
  * `logger`: *object,* must have `log` property of type *function*. Used to log additional details for failed tests.
  * `logall`: *boolean,* whether or not to log all failed tests details or just the first failed test details.

Default `settings` -for usage with [*Jest*](https://jestjs.io/docs/en/getting-started):

```javascript
instance.settings({
  assert: (bool) => expect(bool).toBe(true),
  describe: describe,
  test: test,
  logger: console,
  logall: false
});
```

Though the use cases are very limited, you could also achieve increased control and write the `describe`/`test` calls yourself by doing something like this -this is what it would look like for *Jest*:

```javascript
const tr = new TestRunner().load({ app: myapp, oas: myoas });

const getTr = (done) => tr.clone().settings({
  // Switch the `describe` function used by `oas-test`
  // for a function that just calls the callback
  describe: (_, cb) => cb(),
  // Switch the `test` function used by `oas-test` for a function
  // that calls the callback and passes the `done` argument
  test: (_, cb) => cb(done)
});

// Now we can define it all ourselves and follow
// a more traditional approach
describe('My group of tests', () => {
  test('Test A', (done) => {
    getTr(done).test({
      myOperationId: {
        0: {
          response(res, info, task) {
            // My tests here
            expect(res.body).toMatchSnapshot();
          }
        }
      }
    });
  });

  test('Test B', (done) => {
    getTr(done).test({
      myOperationId: {
        0: {
          // Also works as usual
          validate: 200
        }
      }
    });
  });

  test('Test C', (done) => {
    // Removes the oas definition; now we have to provide the method and path
    getTr(done).load({ app }).test({
      'get:/api/my_endpoint': {
        0: {
          response(res, info, taks) {
            // My tests here
            expect(res.body).toMatchSnapshot();
          }
        }
      }
    });
  });
});
```

### `TestRunner.hook(type, callback): TestRunner`

Used to define each hook to run for all tasks of a `TestRunner` instance. See [order of execution](#task-order-of-execution) for details.

* `type`: *string,* one of: `"data"`, `"request"`, `"response"`.
* `callback`: *function,* as defined below.

#### Data hook

Define a hook to modify the data to be send with the request for each API call.

Usage: `instance.hook('data', callback)`

* `callback`, *function*, with signature `(data?, fake?, info?, task?): data`. Can be a `Promise` returning/*async* function.
  * `data`: *(object | void),* the value returned by [`task.data()`](#taskdatafake-info-task) or a previous data hook if there are several registered for the `TestRunner` instance.
  * `fake`: *object,* a [`fake` data object.](#fake-object)
  * `info`: *object,* an [`info` object.](#info-object)
  * `task`: *object,* a [`task` object.](#task-object)
  * **Must return the data to be sent,** as a [`data` object.](#data-object), or a `Promise` resolving with said object. If it returns `undefined`, no data will be sent on the request.

#### Request hook

Define a hook to modify each request made to the server before it's executed.

Usage: `instance.hook('request', callback)`

* `callback`, *function*, with signature `(req?, info?, task?)`. Can be a `Promise` returning/*async* function. **Must not return the request `req` object** or a `Promise` resolving on one.
  * `req`: *object* a [`superagent`](https://github.com/visionmedia/superagent) request object.
  * `info`: *object,* an [`info` object.](#info-object)
  * `task`: *object,* a [`task` object.](#task-object)

#### Response hook

Define a hook to be called with the server response for each API call.

Usage: `instance.hook('response', callback)`

* `callback`, *function*, with signature `(res?, info?, task?)`. Can be a `Promise` returning/*async* function.
  * `res`: *object* a [`superagent`](https://github.com/visionmedia/superagent) response object.
  * `info`: *object,* an [`info` object.](#info-object)
  * `task`: *object,* a [`task` object.](#task-object)

### `TestRunner.clone(): TestRunner`

Returns a clone of the `TestRunner` instance -with the the same `app`, `url`, and `oas` loaded, and its same settings.

### `TestRunner.self(callback): TestRunner`

Calls `callback` passing itself as a first argument. Useful to split your tests in different files and serial execution is required, and for creating closure for a group of tests.

#### Split tests

When following this strategy, we don't have to define a new `TestRunner` on each test file, and are able to guarantee a serial execution of tests.

File: `index.test.js`

```javascript
import TestRunner from 'oas-test';
import testsA from './my-tests-a';
import testsB from './my-tests-b';

new TestRunner()
  .load(myApp, null, myOas)
  // ...define my hooks and settings if desired
  .self(testsA)
  .self(testsB)
```

File: `my-tests-a.js` (similarly, `my-tests-b.js`)

```javascript
export default (tr) => tr.test({
  // ...my test tasks
});
```

#### Closure

```javascript
instance
  .self(tr => {
    const hello = 'A variable shared for all these test tasks';
    tr.test({
      // ...tasks can use "hello" here
    })
  })
  .test({
    // ...tasks don't have acces to "hello" here
  })
```

### `TestRunner.test(tests): TestRunner`

Loads **and** runs all tasks for all tests.

* `tests`: *object,* a [`tests` object.](#tests-object)

## Schemas

### `tests` object

An *object* with:

* **Property keys** of either (this will be the value of [`info.id`:](#info-object))
  * A *string* matching an [`operationId`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#operationObject) if an OAS was loaded on the TestRunner.
  * A *string* indicating the method and path for the groups of tests to be run if a base URL was loaded on the TestRunner, with format `method:path`, where:
    * `method` is one of `get`, `put`, `post`, `delete`, `options`, `head`, `patch`, `trace`. Ex: `get:/v1/pets`.
    * Path parameters should be templated as `{paramName}` in order for [`data.params`](#data-object) to work. Ex: `get:/v1/pets/{petId}`.
* **Property values** of a [`tasks` object.](#tasks-object)

```javascript
// OAS example
const oasTests = {
  listTodo: {
    'Test name/description': myTaskObject1,
    'Another test': myTaskObject2
  },
  createTodo: {
    'Test name/description': myTaskObject3,
    'Another test': myTaskObject4
  }
}

// Non-OAS example
const nonOasTests = {
  'get:/v1/todos': {
    'Test name/description': myTaskObject5,
    'Another test': myTaskObject6
  },
  'post:/v1/todos': {
    'Test name/description': myTaskObject7,
    'Another test': myTaskObject8
  }
}
```

### `tasks` object

An *object* containing the tasks with:
  **Property keys** of a *string* that sets the task name (this will be the value of [`info.name`.](#info-object))
  **Property values** of a [`task` object.](#task-object)

### `task` object

An *object* defining a single test to be run. See [task order of execution.](#task-order-of-execution)

* `task.data`: *(function|object|boolean), optional,* **default: `true`.**
  * When an *object,* it should be a [`data` object.](#data-object)
  * When a *function*:
    * See [`task.data().`](#taskdatafake-info-task)
    * It is called before the request is made.
    * Should return the data to be sent for the request as a [`data` object.](#data-object), or a `Promise` resolving with said object.
  * When a *boolean*:
    * `true`: sends fake data for required fields only when *a) an OAS has been loaded into the `TestRunner`* and *b) there's only one mimetype for the [`operation` object,](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#operationObject)* otherwise no data will be sent.
    * `false`: no data is sent.
* `task.request`: *function, optional,* called before the request is made. See [`task.request().`](#taskrequestreq-info-task)
* `task.response`: *function, optional,* called after the response is received. Allows you to run additional assertions on the response. Can be *async*. See [`task.response().`](#taskresponseres-info-task)
* `task.validate`: *(number|string), optional,* should specify a status code defined in the *OAS* for the endpoint being tested. If present, it will validate that:
  * The response status code matches.
  * The content type of the response is among the ones defined for that endpoint and status code.
  * The reponse body is valid according to the JSON Schema defined for that endpoint, status code, and content type.
* `task.repeat`: *number, optional,* **default: *1*.** The number of repetitions each task should have. See [`info.iterate`.](#info-object)

#### `task.data(fake?, info?, task?)`

**Must return the data to be sent,** as a [`data` object.](#data-object), or a `Promise` resolving with said object (can be *async*). If it returns `undefined`, no data will be sent on the request.

* `fake`: *object,* a [`fake` data object.](#fake-object)
* `info`: *object,* an [`info` object.](#info-object)
* `task`: *object,* a [`task` definition object](#task-object) (circular).

#### `task.request(req?, info?, task?)`

Manipulates the request to be made. Can be a `Promise` returning/*async* function. **Must not return the request `req` object.**

* `req`: *object,* a [`superagent`](https://github.com/visionmedia/superagent) request object.
* `info`: *object,* an [`info` object.](#info-object)
* `task`: *object,* a [`task` definition object](#task-object) (circular).

#### `task.response(res?, info?, task?)`

Allows you to run additional assertions on the response. Can be a `Promise` returning/*async* function. You are free to mutate the `Response` object, for example, if you need to serialize the `res.text` into the `res.body` in order for the body to be validated against the JSON schema when working with other mime types.

* `res`: *object,* a [`superagent`](https://github.com/visionmedia/superagent) response object. It has, among others, properties `statusCode`, `header`, `body`, and `text`.
* `info`: *object,* an [`info` object.](#info-object)
* `task`: *object,* a [`task` definition object](#task-object) (circular).

### `info` object

* `info.id`: *string,* property name under which a group of tasks are found. Matches the OAS [`operationId`.](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#operationObject)
* `info.name`: *string,* task name, property under which the task is defined.
* `info.endpoint`: *object,* an [`endpoint` object.](#endpoint-object)
* `info.oas`: *object,* a dereferenced OAS obtained from the one loaded in the TestRunner.
* `info.iteration`: *number,* starting on *0;* see [`task.repeat`.](#task-object)
* `info.context`: *object,* a shared context object within the `TestRunner`. Defaults to an empty object.

### `endpoint` object

The endpoint object is obtained from the [`task.id`,](#info-object) as it matches the OAS [`operationId`,](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#operationObject) and provides information about the request being made and the OAS definition for that endpoint.

* `endpoint.path`: *string,* the path the request will be made to, as defined in the [OAS path object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#pathItemObject).
* `endpoint.method`: *string,* the [request method of the operation.](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#pathItemObject) One of `get`, `put`, `post`, `delete`, `options`, `head`, `patch`, `trace`
* `endpoint.operation`: *object,*, the [OAS `operation` object.](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#operationObject)

### `data` object

* `data.params`: *object, optional,* with property keys of the path parameters to be sent and values of their content.
* `data.headers`: *object, optional,* with property keys of the headers to be sent and values of their content.
* `data.query`: *object, optional,* with property keys of the query parameters to be sent and values of their content.
* `data.cookies`: *object, optional,* with property keys of the cookies to be sent and values of their content.
* `data.body`: *any, optional,* the body to be sent with the request.

### `fake` object

An *object* containing automatically generated fake `data` following the schemas for a given [OAS `operation`.](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#operationObject) **Only available when an OAS has been loaded in the `TestRunner`**

* If the OAS [`operation`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#operationObject) has several mimetypes for parameters or the request body:
  * `fake.required`: *object,* with property keys of the mimetype names, and values of [`data` objects,](#data-object) pre-populated with fake data for **required fields** following the request JSON Schema definition.
  * `fake.all`: *object,* with property keys of the mimetype names, and values of [`data` objects,](#data-object) pre-populated with fake data for **all fields** following the request JSON Schema definition.
  * `fake.mimeTypes`: *strings array,* with the mimetype names.

* If the OAS [`operation`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#operationObject) has a single mimetype:
  * `fake.required`: *object,* a [`data` object,](#data-object) pre-populated with fake data for **required fields** following the request JSON Schema definition.
  * `fake.all`: *object,* a [`data` object,](#data-object) pre-populated with fake data for **all fields** following the request JSON Schema definition.
  * `fake.mimeTypes`: an empty *array.*

## Helpers

### `merge(...objects)`

Deep merges an arbitrary amount of objects without mutating any.

```javascript
import { merge } from 'oas-test';

const merged = merge(objA, objB, objC);
```

## Task order of execution

1. [Task data callback](#taskdatafake-info-task)
2. [Data hooks](#Data-hook) (if data is active for the task)
3. [Request hooks](#Request-hook)
4. [Task request callback](#taskrequestreq-info-task)
5. Request execution
6. [Response hooks](#Response-hook)
7. [Task response callback](#taskresponseres-info-task)
8. [Task validation](#task-object) against OAS.
