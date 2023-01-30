const { UsxLexer } = require('./usx_lexer.cjs');

const parseUsx = (str, parser) => {
  new UsxLexer().lexAndParse(str, parser);
};

module.exports = { parseUsx };
