import { UsjLexer } from './usj_lexer';

const parseUsj = (str, parser) => {
  new UsjLexer().lexAndParse(str, parser);
};

export { parseUsj };
