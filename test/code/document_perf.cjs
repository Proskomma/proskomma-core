/* eslint-disable no-useless-escape */
/* eslint-disable no-return-assign */
const test = require('tape');
const deepEqual = require('deep-equal');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Graph PERF';

const pk = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'eng',
  abbr: 'web',
})[0];

test(
  `perf (${testGroup})`,
  async function (t) {
    try {
      t.plan(9);
      let query = '{ documents { perf } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('perf' in result.data.documents[0]);
      let perfJSON;
      t.doesNotThrow(() => perfJSON = JSON.parse(result.data.documents[0].perf));
      query = '{ documents { perf(indent:2) } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('perf' in result.data.documents[0]);
      let perfJSON2;
      t.doesNotThrow(() => perfJSON2 = JSON.parse(result.data.documents[0].perf));
      t.ok(deepEqual(perfJSON, perfJSON2));
    } catch (err) {
      console.log(err);
    }
  },
);
