const path = require('path');
const fse = require('fs-extra');

// 'to' | 'label' by ascending 'to'
const blocksTable = fse.readFileSync(path.resolve('./block_name_characters.tsv'))
    .toString()
    .split("\n")
    .filter(r => r)
    .map(r => r.split("\t"))
    .map(r => [Number("0x" + r[1]), r[2]])

const UPPER = 0;
const LABEL = 1;
// key is upper limit, ie test is "if the value is less than or equal to this limit, go left, else go right?"

const makeTree = table => {
    if (table.length === 1) {
        return table[0][LABEL];
    }
    const midpoint = Math.floor(table.length / 2);
    const leftBranch = makeTree(table.slice(0, midpoint));
    const rightBranch = makeTree(table.slice(midpoint));
    return [
        [table[midpoint-1][UPPER], leftBranch],
        [table[table.length -1][UPPER], rightBranch]
    ];
}

console.log(JSON.stringify(makeTree(blocksTable), null, 2));