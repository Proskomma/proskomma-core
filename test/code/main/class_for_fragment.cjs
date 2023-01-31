/* eslint-disable require-await */
const test = require('tape');
const { preTokenClassForFragment } = require('../../../src/parser/lexers/object_for_fragment.cjs');
const { lexingRegexes } = require('../../../src/parser/lexers/lexingRegexes.cjs');

const testGroup = 'Class for Fragment';

test(
  `Exception (${testGroup})`,
  async function (t) {
    try {
      t.plan(1);
      t.throws(() => preTokenClassForFragment('', lexingRegexes));
    } catch (err) {
      console.log(err);
    }
  },
);
