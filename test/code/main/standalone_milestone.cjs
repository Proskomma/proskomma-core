const test = require('tape');

const {
  pkWithDoc,
} = require('../../lib/load.cjs');

const testGroup = 'Standalone milestones';

const pk = pkWithDoc('../test_data/usfm/standalone_milestone.usfm', {
  lang: 'ara',
  abbr: 'standalone',
})[0];

const query = `{ documents { sequences { type blocks { bg { subType payload } bs { payload } items {type subType payload} } } } }`;

test(
  `Standalone milestone (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const mainSequenceBlocks = result.data.documents[0].sequences.filter(s => s.type === 'main')[0].blocks;
      console.log(JSON.stringify(mainSequenceBlocks, null, 2));
      t.equal(mainSequenceBlocks.length, 2);
      t.equal(mainSequenceBlocks[0].bs.payload, 'blockTag/p');
      t.equal(mainSequenceBlocks[1].bs.payload, 'blockTag/q');
    } catch (err) {
      console.log(err);
    }
  },
);
