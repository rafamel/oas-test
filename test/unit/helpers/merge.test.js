import { merge } from '../../../src';

test('Deep merges object without mutation', () => {
  const obj1 = { hi: { bye: 2, very: 'nice' }, set: { neck: 'res' } };
  const obj2 = { is: { not: 'hell' }, hi: { is: 'well', very: 'important' } };
  const obj3 = { set: 'one', is: { but: 'neck' } };

  expect(obj1).toEqual({ hi: { bye: 2, very: 'nice' }, set: { neck: 'res' } });
  expect(obj2).toEqual({
    is: { not: 'hell' },
    hi: { is: 'well', very: 'important' }
  });
  expect(obj3).toEqual({ set: 'one', is: { but: 'neck' } });
  expect(merge(obj1, obj2, obj3)).toEqual({
    hi: { bye: 2, is: 'well', very: 'important' },
    is: { not: 'hell', but: 'neck' },
    set: 'one'
  });
});
