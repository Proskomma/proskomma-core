const path = require('path');
const test = require('tape');
const fs = require('fs-extra');
const { Validator } = require('proskomma-json-tools');

const { utils } = require('../../../src/index.cjs');

const testGroup = 'Validate Schema';

test(
  `Validate valid document (${testGroup})`,
  function (t) {
    try {
      t.plan(3);
      const serialized = fs.readJsonSync(path.resolve(__dirname, '..', '..', 'test_data', 'utils', 'serialize_example.json'));
      t.ok(serialized);
      const validationReport = new Validator().validate('proskomma',
        'succinct',
        '0.2.0',
        serialized
      );
      t.ok(validationReport.isValid);
      t.equal(validationReport.errors, null);
    } catch (err) {
      console.log(err);
    }
  },
);
