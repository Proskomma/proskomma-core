const test = require('tape');

const { pkWithDoc } = require('../../lib/load.cjs');

const testGroup = 'Milestones in Character Spans';

const pk = pkWithDoc('../test_data/usfm/milestones_in_char_spans.usfm', {
  lang: 'eng',
  abbr: 'glo',
})[0];

const query = '{ documents { mainSequence { blocks { items { type subType payload } } } } }';

// Scope items as 'start x'/'end x', tokens as their payload, ignoring whitespace and chapter scopes
const simplified = block => block.items
  .filter(i => !(i.type === 'token' && i.payload.trim() === ''))
  .filter(i => !i.payload.startsWith('chapter/'))
  .map(i => (i.type === 'scope' ? `${i.subType} ${i.payload}` : i.payload));

const wLemmaMilestoneItems = [
  'start spanWithAtts/w',
  'start attribute/spanWithAtts/w/lemma/0/serpent',
  'start milestone/zwrapper',
  'start attribute/milestone/zwrapper/id/0/lw',
  'serpents',
  'end attribute/milestone/zwrapper/id/0/lw',
  'end milestone/zwrapper',
  'end attribute/spanWithAtts/w/lemma/0/serpent',
  'end spanWithAtts/w',
];

const getBlocks = async t => {
  const result = await pk.gqlQuery(query);
  t.equal(result.errors, undefined);
  return result.data.documents[0].mainSequence.blocks.map(simplified);
};

test(
  `Plain char span (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const blocks = await getBlocks(t);
      t.same(blocks[0], ['start span/k', 'serpent', 'end span/k', 'snake']);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Milestone inside w with following lemma (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const blocks = await getBlocks(t);
      const wStart = blocks[1].indexOf('start spanWithAtts/w');
      t.same(blocks[1].slice(wStart), wLemmaMilestoneItems);
      t.equal(blocks[1].filter(i => i.includes('lemma')).length, 2, 'lemma is an attribute scope, not a token');
      t.same(blocks[1].slice(0, 3), ['start span/k', 'subtle', 'end span/k']);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Milestone inside k does not end the span (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const blocks = await getBlocks(t);
      t.same(
        blocks[2],
        [
          'start span/k',
          'start milestone/zwrapper',
          'start attribute/milestone/zwrapper/id/0/lw',
          'eternal',
          'end attribute/milestone/zwrapper/id/0/lw',
          'end milestone/zwrapper',
          'life',
          'end span/k',
          'life',
          'with',
          'no',
          'end',
        ],
      );
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Standard milestones inside char spans (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const blocks = await getBlocks(t);
      t.same(
        blocks[3],
        [
          'start span/k',
          'start milestone/qt',
          'start attribute/milestone/qt/who/0/Jesus',
          'eternal',
          'end attribute/milestone/qt/who/0/Jesus',
          'end milestone/qt',
          'life',
          'end span/k',
          'and',
          'start span/nd',
          'start milestone/ts',
          'Lord',
          'end milestone/ts',
          'God',
          'end span/nd',
        ],
      );
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Empty milestone inside w keeps following attributes (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const blocks = await getBlocks(t);
      t.same(
        blocks[4],
        [
          'start spanWithAtts/w',
          'start attribute/spanWithAtts/w/lemma/0/grace',
          'start attribute/spanWithAtts/w/strong/0/G5485',
          'start milestone/zempty',
          'start attribute/milestone/zempty/id/0/e',
          'end attribute/milestone/zempty/id/0/e',
          'end milestone/zempty',
          'grace',
          'end attribute/spanWithAtts/w/strong/0/G5485',
          'end attribute/spanWithAtts/w/lemma/0/grace',
          'end spanWithAtts/w',
        ],
      );
    } catch (err) {
      console.log(err);
    }
  },
);
