const test = require('tape');

const {
  pkWithDoc,
} = require('../../lib/load.cjs');

const testGroup = 'Characters';

const [pk, _] = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'eng',
  abbr: 'web',
});
test(
  `uniqueCharacters (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query = '{ documents { mainSequence { uniqueCharacters { key count } } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const content = result.data.documents[0].mainSequence.uniqueCharacters;
        t.equal(content.filter(i => i.key === "p").length, 1);
        t.equal(content.filter(i => i.key === "p")[0].count, 74);
    } catch (err) {
      console.log(err);
    }
  },
);