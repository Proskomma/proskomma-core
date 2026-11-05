const test = require('tape');

const { pkWithDoc } = require('../../lib/load.cjs');

const testGroup = 'Tables';

const pk = pkWithDoc('../test_data/usx/table.usx', {
  lang: 'fra',
  abbr: 'hello',
})[0];
const pk2 = pkWithDoc('../test_data/usfm/table.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];
const pk3 = pkWithDoc('../test_data/usfm/table_at_end.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];
const pk4 = pkWithDoc('../test_data/usfm/table_no_end_cells.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];

const pk5 = pkWithDoc('../test_data/usfm/table_in_intro.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];

const checkResult = (t, result) => {
  const blocks = result.data.documents[0].mainSequence.blocks;
  t.equal(blocks.length, 6);
  t.equal(blocks[0].bs.payload, 'blockTag/p');
  t.false(blocks[0].scopeLabels.includes('table'));
  t.equal(blocks[1].bs.payload, 'blockTag/tr');
  t.ok(blocks[1].scopeLabels.includes('cell/body/left/2'));
  t.ok(blocks[1].scopeLabels.includes('table'));
  t.ok(blocks[2].scopeLabels.includes('cell/body/left/1'));
  t.ok(blocks[2].scopeLabels.includes('cell/body/right/1'));
  t.equal(blocks[5].bs.payload, 'blockTag/p');
  t.false(blocks[5].scopeLabels.includes('table'));
};

const query = `{ documents { sequences { id nBlocks } mainSequence { blocks { scopeLabels bs { payload } bg { subType payload } text items { type subType payload } } } } }`;

test(
  `USX (${testGroup})`,
  async function (t) {
    try {
      t.plan(11);
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      checkResult(t, result);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `USFM (${testGroup})`,
  async function (t) {
    try {
      t.plan(11);
      const result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      checkResult(t, result);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `USFM in intro (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const result = await pk5.gqlQuery(query);
      t.equal(result.errors, undefined);
      const mainSequence = result.data.documents[0].mainSequence;
      t.equal(mainSequence.blocks.length, 1);
      const firstMainBlock = mainSequence.blocks[0];
      t.equal(firstMainBlock.text, 'First verse!');
      const introId = firstMainBlock.bg.filter(g => g.subType === 'introduction')[0].payload;
      t.equal(result.data.documents[0].sequences.filter(s => s.id === introId)[0].nBlocks, 6);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `USFM no cell end tags (${testGroup})`,
  async function (t) {
    try {
      t.plan(11);
      const result = await pk4.gqlQuery(query);
      t.equal(result.errors, undefined);
      checkResult(t, result);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `USFM Table at End of Doc (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const result = await pk3.gqlQuery(query);
      t.equal(result.errors, undefined);
      const lastBlockItems = result.data.documents[0].mainSequence.blocks[2].items;
      t.equal(lastBlockItems.filter(i => i.subType === 'end' && i.payload === 'table').length, 1);
    } catch (err) {
      console.log(err);
    }
  },
);

const pk6 = pkWithDoc('../test_data/usfm/table_range_cell_no_end_cells.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];

test(
  `USFM no cell end tags, next row starts with range cell (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const result = await pk6.gqlQuery(query);
      t.equal(result.errors, undefined);
      const rowScopes = result.data.documents[0].mainSequence.blocks
        .filter(b => b.bs.payload === 'blockTag/tr')
        .map(b => b.items
          .filter(i => i.type === 'scope' && /^(cell|table)/.test(i.payload))
          .map(i => `${i.subType}:${i.payload}`));
      t.deepEqual(rowScopes[0], [
        'start:table',
        'start:cell/body/left/1', 'end:cell/body/left/1',
        'start:cell/body/left/1', 'end:cell/body/left/1',
        'start:cell/body/left/1', 'end:cell/body/left/1',
      ]);
      t.deepEqual(rowScopes[1], [
        'start:cell/body/left/2', 'end:cell/body/left/2',
        'start:cell/body/left/1', 'end:cell/body/left/1',
        'end:table',
      ]);
    } catch (err) {
      console.log(err);
    }
  },
);

const pk7 = pkWithDoc('../test_data/usfm/table_at_end_no_end_cells.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];

test(
  `USFM Table at End of Doc, no cell end tags (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const result = await pk7.gqlQuery(query);
      t.equal(result.errors, undefined);
      const lastRowScopes = result.data.documents[0].mainSequence.blocks
        .filter(b => b.bs.payload === 'blockTag/tr')[1].items
        .filter(i => i.type === 'scope' && /^(cell|table|span)/.test(i.payload))
        .map(i => `${i.subType}:${i.payload}`);
      t.deepEqual(lastRowScopes, [
        'start:cell/body/left/1', 'end:cell/body/left/1',
        'start:cell/body/left/1',
        'start:span/bd', 'end:span/bd',
        'end:cell/body/left/1',
        'end:table',
      ]);
    } catch (err) {
      console.log(err);
    }
  },
);

const rowCellScopes = (result) => result.data.documents[0].mainSequence.blocks
  .filter(b => b.bs.payload === 'blockTag/tr')
  .map(b => b.items
    .filter(i => i.type === 'scope' && /^(cell|table)/.test(i.payload))
    .map(i => `${i.subType}:${i.payload}`));

const pk8 = pkWithDoc('../test_data/usfm/table_range_cell_first_no_end_cells.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];

test(
  `USFM no cell end tags, first row starts with range cell (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const result = await pk8.gqlQuery(query);
      t.equal(result.errors, undefined);
      const rowScopes = rowCellScopes(result);
      t.deepEqual(rowScopes[0], [
        'start:table',
        'start:cell/body/left/2', 'end:cell/body/left/2',
        'start:cell/body/left/1', 'end:cell/body/left/1',
        'start:cell/body/left/1', 'end:cell/body/left/1',
      ]);
      t.deepEqual(rowScopes[1], [
        'start:cell/body/left/1', 'end:cell/body/left/1',
        'start:cell/body/left/1', 'end:cell/body/left/1',
        'end:table',
      ]);
    } catch (err) {
      console.log(err);
    }
  },
);

const pk9 = pkWithDoc('../test_data/usfm/table_range_cell_last_no_end_cells.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];

test(
  `USFM no cell end tags, last row ends with range cell (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const result = await pk9.gqlQuery(query);
      t.equal(result.errors, undefined);
      const rowScopes = rowCellScopes(result);
      t.deepEqual(rowScopes[0], [
        'start:table',
        'start:cell/body/left/1', 'end:cell/body/left/1',
        'start:cell/body/left/1', 'end:cell/body/left/1',
        'start:cell/body/left/1', 'end:cell/body/left/1',
      ]);
      t.deepEqual(rowScopes[1], [
        'start:cell/body/left/1', 'end:cell/body/left/1',
        'start:cell/body/left/2', 'end:cell/body/left/2',
        'end:table',
      ]);
    } catch (err) {
      console.log(err);
    }
  },
);

const pk10 = pkWithDoc('../test_data/usfm/table_range_cell_then_plain_row_no_end_cells.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];

test(
  `USFM no cell end tags, range cell row then plain row (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const result = await pk10.gqlQuery(query);
      t.equal(result.errors, undefined);
      const rowScopes = rowCellScopes(result);
      t.deepEqual(rowScopes[0], [
        'start:table',
        'start:cell/body/left/2', 'end:cell/body/left/2',
        'start:cell/body/left/1', 'end:cell/body/left/1',
      ]);
      t.deepEqual(rowScopes[1], [
        'start:cell/body/left/1', 'end:cell/body/left/1',
        'start:cell/body/left/1', 'end:cell/body/left/1',
        'start:cell/body/left/1', 'end:cell/body/left/1',
        'end:table',
      ]);
    } catch (err) {
      console.log(err);
    }
  },
);
