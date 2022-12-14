/* eslint-disable no-useless-escape */
/* eslint-disable no-return-assign */
const path = require('path');
const test = require('tape');
const fse = require('fs-extra');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Graph USFM';

const pk3 = pkWithDoc('../test_data/usfm/78-GALspavbl.usfm', {
  lang: 'spa',
  abbr: 'vbl',
})[0];

test(
  `usfm (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      let query = '{ documents { usfm } }';
      let result = await pk3.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('usfm' in result.data.documents[0]);

      let rawUsfm = fse.readFileSync(path.resolve(__dirname, '../test_data/usfm/78-GALspavbl.usfm')).toString();
      let tabRawUsfm = rawUsfm.split(/(\\[a-z]+[\d*]?|\n)/g).filter((e) => e !== '' && e !== ' ' && e !== '\n');

      let outputUsfm = result.data.documents[0].usfm;
      let tabOutputUsfm = outputUsfm.split(/(\\[a-z]+[\d\*]?|\n)/g).filter((e) => e !== '' && e !== ' ' && e !== '\n');

      let diff = [];

      tabRawUsfm.forEach((elem, i) => {
        if (!tabOutputUsfm[i] || elem.trim() !== tabOutputUsfm[i].trim()) {
          diff.push([tabOutputUsfm[i], elem]);
        }
      });
      t.equal(diff.join(''), '');
    } catch (err) {
      console.log(err);
    }
  },
);
