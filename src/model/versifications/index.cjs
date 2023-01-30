const engText = require('./eng_vrs');
const lxxText = require('./lxx_vrs');
const orgText = require('./org_vrs');
const rscText = require('./rsc_vrs');
const rsoText = require('./rso_vrs');
const vulText = require('./vul_vrs');

const exports = {
  eng: { raw: engText },
  lxx: { raw: lxxText },
  org: { raw: orgText },
  rsc: { raw: rscText },
  rso: { raw: rsoText },
  vul: { raw: vulText },
};

const cvRegex = /^([A-Z0-9]{3}) (([0-9]+:[0-9]+) ?)*$/;

for (const [vrsName, vrsRecord] of Object.entries(exports)) {
  vrsRecord.cv = {};
  const lineMatches = vrsRecord.raw.split('\n').filter(l => l.match(cvRegex));

  if (!lineMatches) {
    continue;
  }

  for (const line of lineMatches) {
    const cvBook = line.slice(0,3);
    vrsRecord.cv[cvBook] = {};

    for (const cvString of line.substr(4).split(' ')) {
      const [c, v] = cvString.split(':');
      vrsRecord.cv[cvBook][c] = v;
    }
  }
}

module.exports = exports;
