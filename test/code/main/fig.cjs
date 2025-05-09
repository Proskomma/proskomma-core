const test = require('tape');

const {pkWithDoc} = require('../../lib/load.cjs');

const testGroup = 'Fig';

const pk = pkWithDoc('../test_data/usfm/fig.usfm', {
    lang: 'fra',
    abbr: 'hello',
})[0];
const pk2 = pkWithDoc('../test_data/usx/fig.usx', {
    lang: 'fra',
    abbr: 'hello',
})[0];
const pk3 = pkWithDoc('../test_data/usfm/fig_no_caption.usfm', {
    lang: 'fra',
    abbr: 'hello',
})[0];

const query =
    '{ documents { sequences { id type blocks { scopeLabels text items { type subType payload } } } } }';

const checkResult = (t, result) => {
    const sequences = result.data.documents[0].sequences;
    t.equal(sequences.length, 2);
    const figSequence = sequences.filter(s => s.type === 'fig')[0];
    const firstFigItem = figSequence.blocks[0].items[0];
    t.equal(firstFigItem.subType, 'start');
    t.equal(firstFigItem.payload, 'spanWithAtts/fig');
    const lastFigItem = figSequence.blocks[0].items[figSequence.blocks[0].items.length - 1];
    t.equal(lastFigItem.subType, 'end');
    t.equal(lastFigItem.payload, 'spanWithAtts/fig');
    const attributeTypes = figSequence.blocks[0].scopeLabels.filter(sl => sl.startsWith('attribute')).map(sl => sl.split('/')[3]);

    for (const att of ['src', 'size', 'ref']) {
        t.ok(attributeTypes.includes(att));
    }

    const mainSequence = sequences.filter(s => s.type === 'main')[0];
    const lastMainItem = mainSequence.blocks[0].items[mainSequence.blocks[0].items.length - 1];
    t.equal(lastMainItem.type, 'graft');
    t.equal(lastMainItem.subType, 'fig');
};

test(
    `USFM (${testGroup})`,
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
    `USFM with no caption (${testGroup})`,
    async function (t) {
        try {
            t.plan(7);
            const query = "{ documents { mainSequence {blocks {dump scopeLabels(startsWith: \"blockTag\")} } } }";
            const result = await pk3.gqlQuery(query);
            t.equal(result.errors, undefined);
            t.equal(result.data.documents[0].mainSequence.blocks.length, 5);
            for (const [n, blockTag] of ["li", "q", "p", "pc", "pi"].entries()) {
                t.equal(`blockTag/${blockTag}`, result.data.documents[0].mainSequence.blocks[n].scopeLabels[0]);
            }
            // console.log(JSON.stringify(result.data.documents[0].mainSequence.blocks, null, 2));
        } catch (err) {
            console.log(err);
        }
    },
);

test(
    `USX (${testGroup})`,
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
