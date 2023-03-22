const test = require('tape');
const { utils } = require('../../../src');

const testGroup = 'Graft Defs';

test(
  `Get an Id (${testGroup})`,
  function (t) {
    try {
      t.plan(1);
      t.equal(utils.graftDefs.graftLocation['footnote'], 'inline');
    } catch (err) {
      console.log(err);
    }
  },
);
