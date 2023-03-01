const {
  Proskomma,
  lexingRegexes,
  resolvers,
  typeDefs,
} = require('./src/index.cjs');
const blocksSpecUtils = require('./src/util/scriptlike/blocksSpec.cjs');

module.exports = {
  Proskomma, lexingRegexes, blocksSpecUtils, resolvers, typeDefs,
};
