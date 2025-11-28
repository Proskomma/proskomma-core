const test = require('tape');

const { pkWithDoc } = require('../../lib/load.cjs');

const testGroup = 'Khmer Multi-byte UTF-8';

// This test verifies the fix for ByteArray overflow with multi-byte UTF-8 characters
// Issue: Multi-byte UTF-8 strings in enum values were being truncated by character count
// instead of byte count, causing overflow errors when the byte length exceeded 255.
// The Khmer scripture contains combining diacritics that exceed 255 bytes when stored.
// The fix ensures strings are truncated by UTF-8 byte length, not character count.
//
// REGRESSION TEST SUITE:
// This comprehensive test suite ensures that if proskomma-core is modified,
// the multi-byte UTF-8 character handling continues to work correctly.

test(`Import Khmer Matthew USX (${testGroup})`, async function (t) {
  try {
    t.plan(2);
    // This import should not throw "Expected value 0-255 when pushing to ByteArray" error
    const [pk, pkDoc] = pkWithDoc('../test_data/usx/khmer_mat.usx', {
      lang: 'khmer',
      abbr: 'khmtwbtn',
    });
    t.ok(pk !== undefined, 'Proskomma instance created');
    t.ok(pkDoc !== undefined, 'Document created successfully');
  } catch (err) {
    console.log(err);
    t.fail(`Failed to import Khmer scripture: ${err.message}`);
  }
});

test(`Query Headers after Import (${testGroup})`, async function (t) {
  try {
    t.plan(2);
    const [pk] = pkWithDoc('../test_data/usx/khmer_mat.usx', {
      lang: 'khmer',
      abbr: 'khmtwbtn',
    });
    const query = '{ documents { headers { key value } } }';
    const result = await pk.gqlQuery(query);
    t.equal(result.errors, undefined, 'No GraphQL errors');
    t.ok(result.data.documents[0].headers.length > 0, 'Headers exist');
  } catch (err) {
    console.log(err);
    t.fail(`Failed to query headers: ${err.message}`);
  }
});

test(`Query Blocks after Import (${testGroup})`, async function (t) {
  try {
    t.plan(2);
    const [pk] = pkWithDoc('../test_data/usx/khmer_mat.usx', {
      lang: 'khmer',
      abbr: 'khmtwbtn',
    });
    const query = '{ documents { sequences { blocks { text } } } }';
    const result = await pk.gqlQuery(query);
    t.equal(result.errors, undefined, 'No GraphQL errors');
    const blocks = result.data.documents[0].sequences[0].blocks;
    t.ok(blocks.length > 0, 'Blocks exist');
  } catch (err) {
    console.log(err);
    t.fail(`Failed to query blocks: ${err.message}`);
  }
});

test(`Verify Complete Document Processing (${testGroup})`, async function (t) {
  try {
    t.plan(2);
    const [pk] = pkWithDoc('../test_data/usx/khmer_mat.usx', {
      lang: 'khmer',
      abbr: 'khmtwbtn',
    });
    // Test that complete document can be queried without enum-related errors
    const query = '{ documents { id } }';
    const result = await pk.gqlQuery(query);

    t.ok(result.data, 'Query returned data');
    t.ok(result.data.documents && result.data.documents.length > 0, 'Document exists and is queryable');
  } catch (err) {
    console.log(err);
    t.fail(`Failed document processing: ${err.message}`);
  }
});

test(`Verify ByteArray Truncation (No Overflow) (${testGroup})`, async function (t) {
  try {
    t.plan(3);
    // The Khmer text "က︀ျမ︀်းမ︀တ︀်တ︀ႄး" contains combining characters
    // that sum to > 255 UTF-8 bytes. This should not throw an error.
    const [pk, pkDoc] = pkWithDoc('../test_data/usx/khmer_mat.usx', {
      lang: 'khmer',
      abbr: 'khmtwbtn',
    });

    t.ok(pk !== undefined, 'Proskomma instance created (no ByteArray overflow)');
    t.ok(pkDoc !== undefined, 'Document created (enum truncation worked correctly)');

    // Verify the document can be queried without errors
    const result = await pk.gqlQuery('{ documents { id } }');
    t.equal(result.errors, undefined, 'Document is queryable after enum storage');
  } catch (err) {
    // The original error was: "Expected value 0-255 when pushing to ByteArray, found [309|321|381|etc...]"
    if (err.message && err.message.includes('Expected value 0-255 when pushing to ByteArray')) {
      t.fail('ByteArray overflow error detected - fix may have been reverted');
    } else {
      console.log(err);
      t.fail(`Unexpected error: ${err.message}`);
    }
  }
});

test(`Regression Check - No "Expected value 0-255" Error (${testGroup})`, async function (t) {
  try {
    t.plan(1);
    // This test specifically checks that the multi-byte UTF-8 fix is working
    // If the fix is broken, this will throw: "Expected value 0-255 when pushing to ByteArray"
    // The Khmer text contains 309+ byte enums that would trigger this error without the fix
    const [pk] = pkWithDoc('../test_data/usx/khmer_mat.usx', {
      lang: 'khmer',
      abbr: 'khmtwbtn',
    });

    t.pass('Khmer scripture imported without ByteArray overflow (fix is working)');
  } catch (err) {
    if (err.message && err.message.includes('Expected value 0-255 when pushing to ByteArray')) {
      t.fail('REGRESSION: ByteArray overflow error - the multi-byte UTF-8 fix has been broken!');
    } else {
      console.log(err);
      t.fail(`Unexpected error: ${err.message}`);
    }
  }
});
