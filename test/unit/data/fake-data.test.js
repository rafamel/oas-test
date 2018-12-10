import fakeData from '../../../src/data/fake-data';
import operations from './operations';
import jsf from 'json-schema-faker';

// Set randomness generator for faker as constant
jsf.option({ random: () => 0.5 });

describe(`Single Mime Type`, () => {
  test(`No parameters`, () => {
    const fake = fakeData(operations.singleMime.noParams);
    expect(fake).toMatchSnapshot();
  });
  test(`No request body`, () => {
    const fake = fakeData(operations.singleMime.noBody);
    expect(fake).toMatchSnapshot();
  });
  test(`Parameters and request body`, () => {
    const fake = fakeData(operations.singleMime.all);
    expect(fake).toMatchSnapshot();
  });
});

describe(`Multiple Mime Type`, () => {
  test(`No parameters`, () => {
    const fake = fakeData(operations.multipleMimes.noParams);
    expect(fake).toMatchSnapshot();
  });
  test(`No request body`, () => {
    const fake = fakeData(operations.multipleMimes.noBody);
    expect(fake).toMatchSnapshot();
  });
  test(`Parameters and request body`, () => {
    const fake = fakeData(operations.multipleMimes.all);
    expect(fake).toMatchSnapshot();
  });
});
