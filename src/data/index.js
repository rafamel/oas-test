import fakeData from './fake-data';

/**
 * Runs fake data generation; returns data from task.data and data hooks.
 */
export default async function getData(hooks, task, info, operation) {
  function taskData() {
    if (typeof task.data === 'function') return task.data(fake, info, task);
    if (typeof task.data === 'object') return task.data;
    return task.data && !fake.mimeTypes.length ? fake.required : null;
  }

  // Fake data
  const fake = operation ? fakeData(operation) : null;

  // Task data
  let data = await taskData();

  // Data hooks
  data = await hooks.data.reduce((acc, hook) => {
    return acc.then((data) => hook(data, fake, info, task));
  }, Promise.resolve(data));

  return data;
}

/**
 * Gets path from a base path and the path params in a `data` object
 * @param {string} path - A base path, possibly with a param: something/{param}
 * @param {object} data - A `data` object
 * @returns {string}
 */
export function paramsToPath(path, data) {
  const params = (data && data.params) || {};

  const added = [];
  let ans;
  while ((ans = /\{[^}]*\}/g.exec(path))) {
    const param = ans[0];
    const paramKey = param.slice(1, -1);
    if (!params.hasOwnProperty(paramKey)) {
      throw Error(`Param ${paramKey} is not defined in data for ${path}`);
    }
    path = path.replace(param, params[paramKey]);
    added.push(paramKey);
  }

  const remaining = Object.keys(params).filter(
    (param) => !added.includes(param)
  );
  if (remaining.length) {
    throw Error(
      `Param/s is/are not templated in path for ${path}: ${remaining}`
    );
  }

  return path;
}

/**
 * Sets the superagent request object with the data from a `data` object
 * @param {req} req - The title of the book.
 * @param {object} data - A `data` object
 */
export function requestData(req, data) {
  if (!data) return;

  const { headers, query, cookies } = data;

  // Headers
  Object.entries(headers || {}).forEach(([key, value]) => req.set(key, value));

  // Query
  if (query) req.query(query);

  // Cookies
  const cookie = Object.entries(cookies || {}).reduce((acc, [key, value]) => {
    return acc + `${key}=${value};`;
  }, '');
  if (cookie.length) req.set('Cookie', cookie);
}
