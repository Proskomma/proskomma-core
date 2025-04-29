const test = require('tape');

const { pkWithDoc } = require('../../lib/load.cjs');

const testGroup = 'JMP';

const pk = pkWithDoc('../test_data/usfm/jump.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];

test(
  `Jump Dump (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const query =
        '{ documents { mainSequence { blocks {text dump } } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const block = result.data.documents[0].mainSequence.blocks[0];
        t.ok(block.text.includes("TEXTLABEL"));
        t.ok(block.text.includes("Galilee"));
        t.ok(!block.text.includes("LINKHREF"));
        t.ok(!block.text.includes("LINKTITLE"));
    } catch (err) {
      console.log(err);
    }
  },
);