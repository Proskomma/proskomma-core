/* eslint-disable no-useless-escape */
/* eslint-disable no-return-assign */
const test = require('tape');
const deepEqual = require('deep-equal');


const { pkWithDoc } = require('../lib/load');

const testGroup = 'Graph SOFRIA';

const pk = pkWithDoc('../test_data/usfm/78-GALspavbl.usfm', {
  lang: 'spa',
  abbr: 'vbl',
})[0];

const pk2 = pkWithDoc('../test_data/usfm/eng_francl_mrk.usfm', {
  lang: 'eng',
  abbr: 'francl',
})[0];

test(
  `Simple USFM (${testGroup})`,
  async function (t) {
    try {
      t.plan(9);
      let query = '{ documents { sofria } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('sofria' in result.data.documents[0]);
      let sofriaJSON;
      t.doesNotThrow(() => sofriaJSON = JSON.parse(result.data.documents[0].sofria));
      query = '{ documents { sofria(indent:2) } }';
      result = await pk.gqlQuery(query);
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

test(
  `francl (${testGroup})`,
  async function (t) {
    try {
      t.plan(9);
      let query = '{ documents { sofria } }';
      let result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('sofria' in result.data.documents[0]);
      let sofriaJSON;
      t.doesNotThrow(() => sofriaJSON = JSON.parse(result.data.documents[0].sofria));
      query = '{ documents { sofria(indent:2) } }';
      result = await pk2.gqlQuery(query);
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
