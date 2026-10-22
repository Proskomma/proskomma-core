const test = require('tape');

const { pkWithDoc } = require('../../lib/load.cjs');

const testGroup = 'Nested Span Attributes';

const pk = pkWithDoc('../test_data/usfm/nested_span_attributes.usfm', {
  lang: 'eng',
  abbr: 'hello',
}, {}, {
  heading: [],
  paragraph: [],
  char: ['lw'],
  word: [],
  intro: [],
  introHeading: [],
})[0];

const query = '{documents {mainSequence {blocks {items {type subType payload}}}}}';

// Payloads of the items between the start and end of the spanWithAtts/w scope, inclusive
const wSpanItems = items => {
  const start = items.findIndex(i => i.subType === 'start' && i.payload === 'spanWithAtts/w');
  const end = items.findIndex(i => i.subType === 'end' && i.payload === 'spanWithAtts/w');
  return items.slice(start, end + 1).map(i => `${i.subType} ${i.payload}`);
};

const nestedLemmaItems = tag => [
  'start spanWithAtts/w',
  'start attribute/spanWithAtts/w/lemma/0/snake',
  `start span/${tag}`,
  'wordLike snakes',
  `end span/${tag}`,
  'end attribute/spanWithAtts/w/lemma/0/snake',
  'end spanWithAtts/w',
];

test(
  `Attributes wrap nested spans (${testGroup})`,
  async function (t) {
    try {
      t.plan(7);
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const blocks = result.data.documents[0].mainSequence.blocks;
      t.equal(blocks.length, 5);
      t.same(wSpanItems(blocks[0].items), nestedLemmaItems('bd'));
      t.same(wSpanItems(blocks[1].items), nestedLemmaItems('lw'));
      t.same(wSpanItems(blocks[2].items), nestedLemmaItems('lw'));
      t.same(
        wSpanItems(blocks[3].items),
        [
          'start spanWithAtts/w',
          'start attribute/spanWithAtts/w/lemma/0/snake',
          'start attribute/spanWithAtts/w/strong/0/H5175',
          'wordLike the',
          'lineSpace  ',
          'start span/bd',
          'wordLike snakes',
          'end span/bd',
          'lineSpace  ',
          'wordLike hiss',
          'end attribute/spanWithAtts/w/strong/0/H5175',
          'end attribute/spanWithAtts/w/lemma/0/snake',
          'end spanWithAtts/w',
        ],
      );
      t.same(
        wSpanItems(blocks[4].items),
        [
          'start spanWithAtts/w',
          'start attribute/spanWithAtts/w/lemma/0/snake',
          'wordLike snakes',
          'end attribute/spanWithAtts/w/lemma/0/snake',
          'end spanWithAtts/w',
        ],
      );
    } catch (err) {
      console.log(err);
    }
  },
);
