/* eslint-disable no-useless-escape */
/* eslint-disable no-return-assign */
const path = require('path');
const test = require('tape');
const fse = require('fs-extra');
const deepEqual = require('deep-equal');

const { Proskomma } = require('../../src');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Graph SOFRIA';

const pk3 = pkWithDoc('../test_data/usfm/78-GALspavbl.usfm', {
  lang: 'spa',
  abbr: 'vbl',
})[0];

test(
  `sofria (${testGroup})`,
  async function (t) {
    try {
      t.plan(9);
      let query = '{ documents { sofria } }';
      let result = await pk3.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('sofria' in result.data.documents[0]);
      let sofriaJSON;
      t.doesNotThrow(() => sofriaJSON = JSON.parse(result.data.documents[0].sofria));
      query = '{ documents { sofria(indent:2) } }';
      result = await pk3.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('sofria' in result.data.documents[0]);
      let sofriaJSON2;
      t.doesNotThrow(() => sofriaJSON2 = JSON.parse(result.data.documents[0].sofria));
      t.ok(deepEqual(sofriaJSON, sofriaJSON2));
    } catch (err) {
      console.log(err);
    }
  },
);
