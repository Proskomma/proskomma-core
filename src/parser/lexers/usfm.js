const xre = require('xregexp');

const {
  lexingRegexes,
  mainRegex,
} = require('./lexingRegexes.cjs');
const { preTokenObjectForFragment } = require('./object_for_fragment.cjs');

const parseUsfm = (str, parser) => {
  const matches = xre.match(str, mainRegex, 'all');

  for (let n = 0; n < matches.length; n++) {
    parser.parseItem(preTokenObjectForFragment(matches[n], lexingRegexes));
  }
};

module.exports = { parseUsfm };
