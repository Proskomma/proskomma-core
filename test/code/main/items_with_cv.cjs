const test = require('tape');

const { pkWithDoc } = require('../../lib/load.cjs');

const testGroup = 'Items with CV';

const pk = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'eng',
  abbr: 'web',
})[0];

const pk2 = pkWithDoc('../test_data/usx/web_psa_40_60.usx', {
  lang: 'eng',
  abbr: 'web',
})[0];

const pk3 = pkWithDoc('../test_data/usfm/en_ust_oba.usfm', {
  lang: 'eng',
  abbr: 'web',
})[0];

test(
  `Bad cv (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const query =
        `{ docSets { document(bookCode:"RUT") {
                     mainSequence { blocks(withScriptureCV:"2") { items(withScriptureCV:"x=y") {type subType payload} } } } }
                }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors.length, 1);
      t.equal(result.errors.filter(e => e.message.includes('Bad cv reference')).length, 1);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `withScopes + cv (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const query =
        `{ docSets { document(bookCode:"RUT") {
                     mainSequence { blocks(withScriptureCV:"2") { items(withScriptureCV:"2" withScopes:[]) {type, subType, payload} } } } }
                }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors.length, 1);
      t.equal(result.errors.filter(e => e.message.includes('Cannot specify both withScopes and withScriptureCV')).length, 1);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `One Chapter (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query =
        `{ docSets { document(bookCode:"RUT") {
                     mainSequence { blocks(withScriptureCV:"2") { items(withScriptureCV:"2") {type, subType, payload} } } } }
                }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const blocks = result.data.docSets[0].document.mainSequence.blocks;
      const firstBlockItems = blocks[0].items;
      const lastBlockItems = blocks[blocks.length - 1].items;
      t.equal(firstBlockItems.filter(i => i.subType === 'wordLike')[0].payload, 'Naomi');
      t.equal(lastBlockItems.filter(i => i.subType === 'wordLike').reverse()[0].payload, 'law');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Chapter Range (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query =
        `{ docSets { document(bookCode:"RUT") {
                     mainSequence { blocks(withScriptureCV:"1-3") { items(withScriptureCV:"1-3") {type, subType, payload} } } } }
                }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const blocks = result.data.docSets[0].document.mainSequence.blocks;
      const firstBlockItems = blocks[0].items;
      const lastBlockItems = blocks[blocks.length - 1].items;
      t.equal(firstBlockItems.filter(i => i.subType === 'wordLike')[0].payload, 'In');
      t.equal(lastBlockItems.filter(i => i.subType === 'wordLike').reverse()[0].payload, 'today');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Reverse Chapter Range (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const query =
        `{ docSets { document(bookCode:"RUT") {
                     mainSequence { blocks(withScriptureCV:"1-3") { items(withScriptureCV:"3-1") {type, subType, payload} } } } }
                }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors.length, 1);
      t.equal(result.errors.filter(e => e.message.includes('Chapter range must be from min to max')).length, 1);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `One verse (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query =
        `{ docSets { document(bookCode:"RUT") {
                     mainSequence { blocks(withScriptureCV:"1:15") { items(withScriptureCV:"1:15") {type, subType, payload} } } } }
                }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const blocks = result.data.docSets[0].document.mainSequence.blocks;
      const firstBlockItems = blocks[0].items;
      const lastBlockItems = blocks[blocks.length - 1].items;
      t.equal(firstBlockItems.filter(i => i.subType === 'wordLike')[0].payload, 'She');
      t.equal(lastBlockItems.filter(i => i.subType === 'wordLike').reverse()[0].payload, 'law');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Verse zero (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query =
        `{ docSets { document(bookCode:"PSA") {
                     mainSequence { blocks(withScriptureCV:"51:0") { items(withScriptureCV:"51:0") {type, subType, payload} } } } }
                }`;
      const result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      const blocks = result.data.docSets[0].document.mainSequence.blocks;
      const firstBlockItems = blocks[0].items;
      const lastBlockItems = blocks[blocks.length - 1].items;
      t.equal(firstBlockItems.filter(i => i.subType === 'wordLike')[0].payload, 'For');
      t.equal(lastBlockItems.filter(i => i.subType === 'wordLike').reverse()[0].payload, 'Bathsheba');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Verse range (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query =
        `{ docSets { document(bookCode:"RUT") {
                     mainSequence { blocks(withScriptureCV:"1:10-13") { items(withScriptureCV:"1:10-13") {type, subType, payload} } } } }
                }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const blocks = result.data.docSets[0].document.mainSequence.blocks;
      const firstBlockItems = blocks[0].items;
      const lastBlockItems = blocks[blocks.length - 1].items;
      t.equal(firstBlockItems.filter(i => i.subType === 'wordLike')[0].payload, 'They');
      t.equal(lastBlockItems.filter(i => i.subType === 'wordLike').reverse()[0].payload, 'me');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Verse range from zero (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query =
        `{ docSets { document(bookCode:"PSA") {
                     mainSequence { blocks(withScriptureCV:"51:0-1") { items(withScriptureCV:"51:0-1") {type, subType, payload} } } } }
                }`;
      const result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      const blocks = result.data.docSets[0].document.mainSequence.blocks;
      const firstBlockItems = blocks[0].items;
      const lastBlockItems = blocks[blocks.length - 1].items;
      t.equal(firstBlockItems.filter(i => i.subType === 'wordLike')[0].payload, 'For');
      t.equal(lastBlockItems.filter(i => i.subType === 'wordLike').reverse()[0].payload, 'transgressions');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Chapter/verse range (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query =
        `{ docSets { document(bookCode:"RUT") {
                     mainSequence { blocks(withScriptureCV:"1:22-3:3") { items(withScriptureCV:"1:22-3:3") {type, subType, payload} } } } }
                }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const blocks = result.data.docSets[0].document.mainSequence.blocks;
      const firstBlockItems = blocks[0].items;
      const lastBlockItems = blocks[blocks.length - 1].items;
      t.equal(firstBlockItems.filter(i => i.subType === 'wordLike')[0].payload, 'So');
      t.equal(lastBlockItems.filter(i => i.subType === 'wordLike').reverse()[0].payload, 'drinking');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Chapter/verse range to zero (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query =
        `{ docSets { document(bookCode:"PSA") {
                     mainSequence { blocks(withScriptureCV:"50:23-51:0") { items(withScriptureCV:"50:23-51:0") {type, subType, payload} } } } }
                }`;
      const result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      const blocks = result.data.docSets[0].document.mainSequence.blocks;
      const firstBlockItems = blocks[0].items;
      const lastBlockItems = blocks[blocks.length - 1].items;
      t.equal(firstBlockItems.filter(i => i.subType === 'wordLike')[0].payload, 'Whoever');
      t.equal(lastBlockItems.filter(i => i.subType === 'wordLike').reverse()[0].payload, 'Bathsheba');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Chapter/verse range from zero (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query =
        `{ docSets { document(bookCode:"PSA") {
                     mainSequence { blocks(withScriptureCV:"51:0-52:1") { items(withScriptureCV:"51:0-52:1") {type, subType, payload} } } } }
                }`;
      const result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      const blocks = result.data.docSets[0].document.mainSequence.blocks;
      const firstBlockItems = blocks[0].items;
      const lastBlockItems = blocks[blocks.length - 1].items;
      t.equal(firstBlockItems.filter(i => i.subType === 'wordLike')[0].payload, 'For');
      t.equal(lastBlockItems.filter(i => i.subType === 'wordLike').reverse()[0].payload, 'continually');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Chapter/verse range tokens (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query =
        `{ docSets { document(bookCode:"RUT") {
                     mainSequence { blocks(withScriptureCV:"1:22-3:3") { tokens(withScriptureCV:"1:22-3:3") { subType payload } } } } }
                }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const blocks = result.data.docSets[0].document.mainSequence.blocks;
      const firstBlockItems = blocks[0].tokens;
      const lastBlockItems = blocks[blocks.length - 1].tokens;
      t.equal(firstBlockItems[0].payload, 'So');
      t.equal(lastBlockItems.filter(i => i.subType === 'wordLike').reverse()[0].payload, 'drinking');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Chapter/verse range text (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query =
        `{ docSets { document(bookCode:"RUT") {
                     mainSequence { blocks(withScriptureCV:"1:22-3:3") { text(withScriptureCV:"1:22-3:3") } } } }
                }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const blocks = result.data.docSets[0].document.mainSequence.blocks;
      const firstBlockText = blocks[0].text;
      const lastBlockText = blocks[blocks.length - 1].text;
      t.ok(firstBlockText.startsWith('So'));
      t.ok(lastBlockText.endsWith('drinking.'));
    } catch (err) {
      console.log(err);
    }
  },
);
test(
  `Chapter/verse with excludeScopeType (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const query =
        `{ docSets 
          { document(bookCode:"OBA") 
           { sequences 
            { blocks(withScriptureCV:"1:1-3") 
              { items(withScriptureCV:"1:1-3" ,excludeScopeTypes:["milestone", "attribute", "spanWithAtts"])
                {  
                  type
                  subType
                  payload
                } 
              } 
            } 
          } 
        }
      }`;
      const result = await pk3.gqlQuery(query);
      t.equal(result.errors, undefined);

      // Flatten all items across all blocks into a single array
      const items = result.data.docSets[0].document.sequences[0].blocks.flatMap(block => block.items);

      // Find the specific scopes for verses 1, 2, and 3
      const verse1 = items.find(item => item.type === 'scope' && item.subType === 'start' && item.payload === 'verses/1');
      const verse2 = items.find(item => item.type === 'scope' && item.subType === 'start' && item.payload === 'verses/2');
      const verse3 = items.find(item => item.type === 'scope' && item.subType === 'start' && item.payload === 'verses/3');

      // Ensure excluded scope types are not present
      const excludeScopeType = items.find(item => 
        item.payload.startsWith('attribute') || 
        item.payload.startsWith('milestone') || 
        item.payload.startsWith('spanWithAtts')
      );

      t.notEqual(verse1, undefined, 'Didnt found scope start for verses/1');
      t.notEqual(verse2, undefined, 'Didnt found scope start for verses/2');
      t.notEqual(verse3, undefined, 'Didnt found scope start for verses/3');
      t.equal(excludeScopeType, undefined, 'Excluded scope types found');

    } catch (err) {
      console.log(err);
      t.fail('Test threw an unexpected error');
    }
  },
);
