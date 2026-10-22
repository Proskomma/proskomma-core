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

const pkDefault = pkWithDoc('../test_data/usfm/jump_default.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];

const pkExplicit = pkWithDoc('../test_data/usfm/jump_explicit.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];

// xt is not in the built-in word-level marker list, so pass it as a custom word tag to reach its default
const pkWordDefaults = pkWithDoc('../test_data/usfm/word_attribute_defaults.usfm', {
  lang: 'fra',
  abbr: 'hello',
}, {}, {
  heading: [],
  paragraph: [],
  char: [],
  word: ['xt'],
  intro: [],
  introHeading: [],
})[0];

const itemsQuery = '{documents {mainSequence {blocks {items {type subType payload}}}}}';

const blockItems = result => result.data.documents[0].mainSequence.blocks[0].items;

const scopePayloads = items => items.filter(i => i.type === 'scope').map(i => `${i.subType} ${i.payload}`);

test(
  `Jump default attribute is link-href (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const result = await pkDefault.gqlQuery(itemsQuery);
      t.equal(result.errors, undefined);
      const items = blockItems(result);
      t.equal(
        items.filter(i => i.subType === 'start' && i.payload === 'attribute/spanWithAtts/jmp/link-href/0/prj:RSV52').length,
        1,
      );
      t.equal(items.filter(i => i.payload.includes('unknownDefault_jmp')).length, 0);
      const spanStart = items.findIndex(i => i.subType === 'start' && i.payload === 'spanWithAtts/jmp');
      const spanEnd = items.findIndex(i => i.subType === 'end' && i.payload === 'spanWithAtts/jmp');
      t.same(
        items.slice(spanStart, spanEnd).filter(i => i.type === 'token').map(i => i.payload),
        ['RSV'],
      );
      t.ok(items.findIndex(i => i.type === 'token' && i.payload === 'end') > spanEnd);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Jump default attribute matches explicit link-href (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const defaultResult = await pkDefault.gqlQuery(itemsQuery);
      const explicitResult = await pkExplicit.gqlQuery(itemsQuery);
      t.equal(defaultResult.errors, undefined);
      t.equal(explicitResult.errors, undefined);
      t.same(scopePayloads(blockItems(defaultResult)), scopePayloads(blockItems(explicitResult)));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Other default attributes are unchanged (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const result = await pkWordDefaults.gqlQuery(itemsQuery);
      t.equal(result.errors, undefined);
      const items = blockItems(result);
      for (const payload of [
        'attribute/spanWithAtts/w/lemma/0/Ἰησοῦς',
        'attribute/spanWithAtts/rb/gloss/0/かん:じ',
        'attribute/spanWithAtts/xt/link-href/0/MRK 1:9',
      ]) {
        t.equal(items.filter(i => i.subType === 'start' && i.payload === payload).length, 1);
      }
      t.equal(items.filter(i => i.payload.includes('unknownDefault_')).length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);
