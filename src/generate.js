import supertest from 'supertest';
import superagent from 'superagent';
import urlJoin from 'url-join';
import { deferred } from 'promist';
import validate from './validate';
import getData, { paramsToPath, requestData } from './data';

function taskDefaults(task, hasOas) {
  const defaults = {
    validate: null,
    repeat: 1,
    data: !!hasOas,
    request(req, task) {},
    response(res, task) {
      return res;
    }
  };

  return Object.assign(defaults, task);
}

async function initTask(store, operationId, taskName, task) {
  const [oas, collection] = await Promise.all([store.oas, store.collection]);

  if (collection && !collection.hasOwnProperty(operationId)) {
    throw Error(`operationId ${operationId} doesn't exist in OAS.`);
  }

  let endpoint;
  if (collection) endpoint = collection[operationId];
  else {
    const methodPath = operationId.split(':');
    const method = methodPath[0];
    const path = methodPath.slice(1).join(':');
    if (!method || !path) {
      throw Error(
        `Method and path were not properly defined at ${operationId}`
      );
    }
    endpoint = { path, method, operation: null };
  }

  return {
    info: {
      id: operationId,
      name: taskName,
      endpoint,
      oas,
      context: store.context,
      iteration: 0
    },
    task: taskDefaults(task, !!oas)
  };
}

async function runTask(store, info, task) {
  const { app, url, hooks } = store;

  // Stop if iterations have reached repeat
  if (Math.max(task.repeat, 0) - info.iteration < 1) return;

  const endpoint = info.endpoint;
  const data = task.data
    ? await getData(hooks, task, info, endpoint.operation)
    : undefined;

  // Get data, path with params, and body
  const path = paramsToPath(endpoint.path, data);
  const body = data && data.body;

  // Prepare request
  const req = app
    ? supertest(app)[endpoint.method](urlJoin('/', url || '', path))
    : superagent[endpoint.method](urlJoin(url, path));

  // Run data request parameters (header, query, cookies)
  if (data) requestData(req, data);

  // Run request hooks
  await hooks.request.reduce((acc, hook) => {
    return acc.then(() => hook(req, info, task));
  }, Promise.resolve());

  // Run test request callback
  await task.request(req, info, task);

  // Run request
  const res = await req.send(body);

  // Run response hooks
  await hooks.response.reduce((acc, hook) => {
    return acc.then(() => hook(res, info, task));
  }, Promise.resolve());

  // Run task response
  await task.response(res, info, task);

  // Run validate
  if (task.validate) validate(store, task.validate, res, info);

  return runTask(store, { ...info, iteration: info.iteration + 1 }, task);
}

function createCount(initialValue, onZero) {
  let count = initialValue;
  return {
    decrease() {
      count--;
      if (count <= 0) return onZero();
    }
  };
}

export default function generate(store, tests) {
  const { settings } = store;

  const promise = deferred();
  const count = createCount(
    Object.values(tests).reduce(
      (acc, tasks) => acc + Object.keys(tasks).length,
      0
    ),
    () => promise.resolve()
  );

  Object.entries(tests).forEach(([operationId, tasks]) => {
    settings.describe(operationId, () => {
      Object.entries(tasks).forEach(([taskName, task]) => {
        settings.test(taskName, (done) => {
          return initTask(store, operationId, taskName, task)
            .then(({ info, task }) => runTask(store, info, task))
            .then(() => {
              count.decrease();
              if (typeof done === 'function') done();
            })
            .catch((e) => promise.reject(e));
        });
      });
    });
  });

  return promise;
}
