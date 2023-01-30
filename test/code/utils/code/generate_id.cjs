const test = require('tape');
const { utils } = require('../../../../src/index.cjs');

const testGroup = 'Generate ID';

test(
  `Get an Id (${testGroup})`,
  function (t) {
    try {
      t.plan(1);
      const id = utils.generateId();
      t.equal(id.length, 12);
    } catch (err) {
      console.log(err);
    }
  },
);
