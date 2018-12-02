import _deep from 'lodash.clonedeep';
import _merge from 'lodash.merge';

// TODO typings
export default function merge(...objs) {
  const a = _deep(objs.shift());
  return _merge(a, ...objs);
}
