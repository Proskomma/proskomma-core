const test = require('tape');
const path = require('path');
const fse = require('fs-extra');

const {Proskomma} = require('../../../src');

const testGroup = 'Document';

test(
    `Unknown Content Format (${testGroup})`,
    function (t) {
        try {
            t.plan(1);
            const pk = new Proskomma();

            t.throws(() => pk.importDocument({
                lang: 'deu',
                abbr: 'xyz',
            }, 'mov', 'abc', {}));
        } catch (err) {
            console.log(err);
        }
    },
);

test(
    `USJ (${testGroup})`,
    function async (t) {
        try {
            t.plan(2);
            const pk = new Proskomma();
            const usj = fse.readFileSync(path.resolve('test/test_data/usj/hello_usj.json'));
            t.doesNotThrow(() => pk.importDocument({
                lang: 'eng',
                abbr: 'xyz',
            }, 'usj', usj, {}));
            const usfmQuery = "{documents {usfm usj}}";
            const result = pk.gqlQuerySync(usfmQuery);
            t.equal(result.errors, undefined);
            // console.log(JSON.stringify(JSON.parse(result.data.documents[0].usj),  null, 2));
            // console.log(result.data.documents[0].usfm);
        } catch (err) {
            console.log(err);
        }
    }
);