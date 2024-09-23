const test = require('tape');

const { Proskomma } = require('../../../src');
const {
  pkWithDoc,
} = require('../../lib/load.cjs');

const testGroup = 'SFM weirdness';

const [pk, pkDoc] = pkWithDoc('../test_data/usfm/christmas.sfm', {
  lang: 'eng',
  abbr: 'xmas',
});
test(
  `DocSets (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const query = '{ docSets { id lang: selector(id:"lang") abbr: selector(id:"abbr") } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('id' in result.data.docSets[0]);
      t.equal(result.data.docSets[0].lang, 'eng');
      t.equal(result.data.docSets[0].abbr, 'xmas');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `nDocuments in docSet (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query = '{ docSets { nDocuments } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('nDocuments' in result.data.docSets[0]);
      t.equal(result.data.docSets[0].nDocuments, 1);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `DocSet (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      const query = `{ docSet(id: "${pkDoc.docSetId}") { id lang: selector(id:"lang") abbr: selector(id:"abbr") documents { id bookCode: header(id: "bookCode") } } }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('id' in result.data.docSet);
      t.equal(result.data.docSet.documents[0].bookCode, "CHRISTMAS");
      t.equal(result.data.docSet.lang, 'eng');
      t.equal(result.data.docSet.abbr, 'xmas');
      t.ok('id' in result.data.docSet.documents[0]);
    } catch (err) {
      console.log(err);
    }
  },
);