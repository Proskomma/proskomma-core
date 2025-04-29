const test = require('tape');

const {
  pkWithDoc,
} = require('../../lib/load.cjs');

const testGroup = 'Standalone milestones';

const pk = pkWithDoc('../test_data/usfm/standalone_milestone.usfm', {
  lang: 'ara',
  abbr: 'standalone',
})[0];

const query = `{ documents { sequences { type blocks { bs { payload } items {type subType payload} } } } }`;

test(
  `Standalone milestone (${testGroup})`,
  async function (t) {
    try {
      t.plan(10);
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const mainSequenceBlocks = result.data.documents[0].sequences.filter(s => s.type === 'main')[0].blocks;
      // console.log(JSON.stringify(mainSequenceBlocks[1], null, 2));
      t.equal(mainSequenceBlocks.length, 2);
      t.equal(mainSequenceBlocks[0].bs.payload, 'blockTag/p');
      t.equal(mainSequenceBlocks[1].bs.payload, 'blockTag/q');
      t.equal(mainSequenceBlocks[0].items.filter(i => i.subType === "start" && i.payload.startsWith("attribute/milestone/zvideo")).length, 2);
      t.equal(mainSequenceBlocks[0].items.filter(i => i.subType === "end" && i.payload.startsWith("attribute/milestone/zvideo")).length, 2);
      t.equal(mainSequenceBlocks[0].items.filter(i => i.subType === "start" && i.payload.startsWith("attribute/milestone/zvideo/id")).length, 1);
      t.equal(mainSequenceBlocks[0].items.filter(i => i.subType === "end" && i.payload.startsWith("attribute/milestone/zvideo/banana/0/split")).length, 1);
      t.equal(mainSequenceBlocks[1].items.filter(i => i.subType === "start" && i.payload.startsWith("milestone/zempty")).length, 1);
      t.equal(mainSequenceBlocks[1].items.filter(i => i.subType === "start" && i.payload.startsWith("attribute/milestone/zempty")).length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);
