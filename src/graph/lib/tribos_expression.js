import xre from 'xregexp';

const aggregateFunctions = {
  equals: (docSet, node, a, b) => a === b,
  notEqual: (docSet, node, a, b) => a !== b,
  and: (docSet, node, ...args) => args.filter((a) => !a).length === 0,
  or: (docSet, node, ...args) => args.filter((a) => a).length > 0,
  not: (docSet, node, a) => !a,
  idRef: (docSet, node) =>
    docSet.unsuccinctifyScopes(node.bs)[0][2].split('/')[1],
  parentIdRef: (docSet, node) =>
    docSet
      .unsuccinctifyScopes(node.is)
      .filter((s) => s[2].startsWith('tTreeParent'))[0][2]
      .split('/')[1],
  nChildren: (docSet, node) =>
    docSet
      .unsuccinctifyScopes(node.is)
      .filter((s) => s[2].startsWith('tTreeChild')).length,
  contentRef: (docSet, node, label) => {
    const labelIG = docSet
      .sequenceItemsByScopes([node], ['tTreeContent/'], false)
      .filter((ig) => {
        const key = ig[0]
          .filter((s) => s.startsWith('tTreeContent'))[0]
          .split('/')[1];
        return key === label;
      });
    return labelIG[0]
      ? labelIG[0][1]
          .filter((i) => i[0] === 'token')
          .map((t) => t[2])
          .join('')
      : '';
  },
  hasContent: (docSet, node, label) => {
    const labelIG = docSet
      .sequenceItemsByScopes([node], ['tTreeContent/'], false)
      .filter((ig) => {
        const key = ig[0]
          .filter((s) => s.startsWith('tTreeContent'))[0]
          .split('/')[1];
        return key === label;
      });
    return labelIG.length > 0;
  },
  concat: (docSet, node, ...args) => args.join(''),
  startsWith: (docSet, node, a, b) => a.startsWith(b),
  endsWith: (docSet, node, a, b) => a.endsWith(b),
  contains: (docSet, node, a, b) => a.includes(b),
  matches: (docSet, node, a, b) => xre.test(a, xre(b)),
  int: (docSet, node, str) => parseInt(str),
  string: (docSet, node, int) => `${int}`,
  left: (docSet, node, str, int) => str.substring(0, int),
  right: (docSet, node, str, int) => str.substring(str.length - int),
  length: (docSet, node, str) => str.length,
  indexOf: (docSet, node, a, b) => a.indexOf(b),
  add: (docSet, node, ...args) => args.reduce((x, y) => x + y),
  mul: (docSet, node, ...args) => args.reduce((x, y) => x * y),
  sub: (docSet, node, a, b) => a - b,
  div: (docSet, node, a, b) => Math.floor(a / b),
  mod: (docSet, node, a, b) => a % b,
  gt: (docSet, node, a, b) => a > b,
  lt: (docSet, node, a, b) => a < b,
  ge: (docSet, node, a, b) => a >= b,
  le: (docSet, node, a, b) => a <= b,
};

const parseFunctions = {
  quotedString: (str) => str.substring(1, str.length - 1),
  int: (str) => parseInt(str),
  true: () => true,
  false: () => false,
};

const splitArgs = (str) => {
  const ret = [[]];
  let pos = 0;
  let nParen = 0;
  let inQuote = false;

  while (str && pos < str.length) {
    switch (str[pos]) {
      case '\\':
        ret[ret.length - 1].push(str[pos]);

        if (str[pos + 1] === "'") {
          ret[ret.length - 1].push(str[pos + 1]);
          pos++;
        }
        break;
      case "'":
        ret[ret.length - 1].push(str[pos]);
        inQuote = !inQuote;
        break;
      case '(':
        if (inQuote) {
          ret[ret.length - 1].push(str[pos]);
        } else {
          ret[ret.length - 1].push(str[pos]);
          nParen++;
        }
        break;
      case ')':
        if (inQuote) {
          ret[ret.length - 1].push(str[pos]);
        } else {
          ret[ret.length - 1].push(str[pos]);
          nParen--;
        }
        break;
      case ',':
        if (!inQuote && nParen === 0) {
          ret.push([]);

          while (str[pos + 1] === ' ') {
            pos++;
          }
        } else {
          ret[ret.length - 1].push(str[pos]);
        }
        break;
      default:
        ret[ret.length - 1].push(str[pos]);
    }
    pos++;
  }
  return ret.map((e) => e.join(''));
};

const expressions = {
  expression: {
    oneOf: ['stringExpression', 'intExpression', 'booleanExpression'],
  },
  booleanExpression: {
    oneOf: [
      'booleanPrimitive',
      'equals',
      'notEqual',
      'and',
      'or',
      'not',
      'contains',
      'startsWith',
      'endsWith',
      'matches',
      'gt',
      'lt',
      'ge',
      'le',
      'hasContent',
    ],
  },
  stringExpression: {
    oneOf: [
      'concat',
      'left',
      'right',
      'string',
      'idRef',
      'parentIdRef',
      'contentRef',
      'stringPrimitive',
    ],
  },
  intExpression: {
    oneOf: [
      'length',
      'indexOf',
      'int',
      'nChildren',
      'intPrimitive',
      'add',
      'sub',
      'mul',
      'div',
      'mod',
    ],
  },
  equals: {
    regex: xre('^==\\((.+)\\)$'),
    doc: {
      operator: '==',
      args: ['expression', 'expression'],
      result: 'boolean',
      description: 'Are the arguments strictly equal?',
    },
    argStructure: [['expression', [2, 2]]],
  },
  notEqual: {
    regex: xre('^!=\\((.+)\\)$'),
    doc: {
      operator: '!=',
      args: ['expression', 'expression'],
      result: 'boolean',
      description: 'Are the arguments not strictly equal?',
    },
    argStructure: [['expression', [2, 2]]],
  },
  and: {
    regex: xre('^and\\((.+)\\)$'),
    doc: {
      operator: 'and',
      args: ['boolean', 'boolean', '...'],
      result: 'boolean',
      description: 'Are all the arguments true?',
    },
    breakOn: false,
    argStructure: [['booleanExpression', [2, null]]],
  },
  or: {
    regex: xre('^or\\((.+)\\)$'),
    doc: {
      operator: 'or',
      args: ['boolean', 'boolean'],
      result: 'boolean',
      description: 'Are any arguments true?',
    },
    breakOn: true,
    argStructure: [['booleanExpression', [2, null]]],
  },
  concat: {
    regex: xre('^concat\\((.+)\\)$'),
    doc: {
      operator: 'concat',
      args: ['string', 'string', '...'],
      result: 'string',
      description: 'Concatenates string arguments',
    },
    argStructure: [['stringExpression', [2, null]]],
  },
  contentRef: {
    regex: xre('^content\\((.+)\\)$'),
    doc: {
      operator: 'content',
      args: ['string'],
      result: 'string',
      description: 'String value of the specified content for the node',
    },
    argStructure: [['stringExpression', [1, 1]]],
  },
  hasContent: {
    regex: xre('^hasContent\\((.+)\\)$'),
    doc: {
      operator: 'hasContent',
      args: ['string'],
      result: 'boolean',
      description: 'Does the node have this content?',
    },
    argStructure: [['stringExpression', [1, 1]]],
  },
  contains: {
    regex: xre('^contains\\((.+)\\)$'),
    doc: {
      operator: 'contains',
      args: ['string', 'string'],
      result: 'boolean',
      description: 'Does the first string contain the second string?',
    },
    argStructure: [['stringExpression', [2, 2]]],
  },
  startsWith: {
    regex: xre('^startsWith\\((.+)\\)$'),
    doc: {
      operator: 'startsWith',
      args: ['string', 'string'],
      result: 'boolean',
      description: 'Does the first string start with the second string?',
    },
    argStructure: [['stringExpression', [2, 2]]],
  },
  endsWith: {
    regex: xre('^endsWith\\((.+)\\)$'),
    doc: {
      operator: 'endsWith',
      args: ['string', 'string'],
      result: 'boolean',
      description: 'Does the first string end with the second string?',
    },
    argStructure: [['stringExpression', [2, 2]]],
  },
  matches: {
    regex: xre('^matches\\((.+)\\)$'),
    doc: {
      operator: 'matches',
      args: ['string', 'regex'],
      result: 'boolean',
      description:
        'Does the first string match the regex in the second string?',
    },
    argStructure: [['stringExpression', [2, 2]]],
  },
  left: {
    regex: xre('^left\\((.+)\\)$'),
    doc: {
      operator: 'left',
      args: ['string', 'integer'],
      result: 'string',
      description: 'The first n characters of the string',
    },
    argStructure: [
      ['stringExpression', [1, 1]],
      ['intExpression', [1, 1]],
    ],
  },
  right: {
    regex: xre('^right\\((.+)\\)$'),
    doc: {
      operator: 'right',
      args: ['string', 'integer'],
      result: 'string',
      description: 'The last n characters of the string',
    },
    argStructure: [
      ['stringExpression', [1, 1]],
      ['intExpression', [1, 1]],
    ],
  },
  length: {
    regex: xre('^length\\((.+)\\)$'),
    doc: {
      operator: 'length',
      args: ['string'],
      result: 'integer',
      description: 'The number of characters in the string',
    },
    argStructure: [['stringExpression', [1, 1]]],
  },
  indexOf: {
    regex: xre('^indexOf\\((.+)\\)$'),
    doc: {
      operator: 'indexOf',
      args: ['string', 'string'],
      result: 'number',
      description:
        'The integer position at which the second string starts in the first string',
    },
    argStructure: [['stringExpression', [2, 2]]],
  },
  not: {
    regex: xre('^not\\((.+)\\)$'),
    doc: {
      operator: 'not',
      args: ['boolean'],
      result: 'boolean',
      description: 'The inverse boolean value of the argument',
    },
    argStructure: [['booleanExpression', [1, 1]]],
  },
  int: {
    regex: xre('^int\\((.+)\\)$'),
    doc: {
      operator: 'int',
      args: ['string'],
      result: 'integer',
      description: 'The integer value of the string',
    },
    argStructure: [['stringExpression', [1, 1]]],
  },
  string: {
    regex: xre('^string\\((.+)\\)$'),
    doc: {
      operator: 'string',
      args: ['integer'],
      result: 'string',
      description: 'The string value of the integer',
    },
    argStructure: [['intExpression', [1, 1]]],
  },
  idRef: {
    regex: xre('^id$'),
    doc: {
      operator: 'id',
      args: [],
      result: 'string',
      description: 'The node ID',
    },
    argStructure: [],
  },
  parentIdRef: {
    regex: xre('^parentId$'),
    doc: {
      operator: 'parentId',
      args: [],
      result: 'string',
      description: "The node's parent ID",
    },
    argStructure: [],
  },
  nChildren: {
    regex: xre('^nChildren$'),
    doc: {
      operator: 'nChildren',
      args: [],
      result: 'int',
      description: 'The number of children of the node',
    },
    argStructure: [],
  },
  add: {
    regex: xre('^add\\((.+)\\)$'),
    doc: {
      operator: 'add',
      args: ['integer', '...'],
      result: 'integer',
      description: 'The numeric sum of the arguments',
    },
    argStructure: [['intExpression', [2, null]]],
  },
  mul: {
    regex: xre('^mul\\((.+)\\)$'),
    doc: {
      operator: 'mul',
      args: ['integer', '...'],
      result: 'integer',
      description: 'The numeric product of the arguments',
    },
    argStructure: [['intExpression', [2, null]]],
  },
  sub: {
    regex: xre('^sub\\((.+)\\)$'),
    doc: {
      operator: 'sub',
      args: ['integer', 'integer'],
      result: 'integer',
      description: 'The first integer minus the second',
    },
    argStructure: [['intExpression', [2, 2]]],
  },
  div: {
    regex: xre('^div\\((.+)\\)$'),
    doc: {
      operator: 'div',
      args: ['integer', 'integer'],
      result: 'integer',
      description: 'The first integer divided by the second',
    },
    argStructure: [['intExpression', [2, 2]]],
  },
  mod: {
    regex: xre('^mod\\((.+)\\)$'),
    doc: {
      operator: 'mod',
      args: ['integer', 'integer'],
      result: 'integer',
      description:
        'The modulus of the first integer when divided by the second',
    },
    argStructure: [['intExpression', [2, 2]]],
  },
  gt: {
    regex: xre('^>\\((.+)\\)$'),
    doc: {
      operator: '>',
      args: ['integer', 'integer'],
      result: 'boolean',
      description: 'Is the first integer numerically greater than the second?',
    },
    argStructure: [['intExpression', [2, 2]]],
  },
  lt: {
    regex: xre('^<\\((.+)\\)$'),
    doc: {
      operator: '<',
      args: ['integer', 'integer'],
      result: 'boolean',
      description: 'Is the first integer numerically less than the second?',
    },
    argStructure: [['intExpression', [2, 2]]],
  },
  ge: {
    regex: xre('^>=\\((.+)\\)$'),
    doc: {
      operator: '>=',
      args: ['integer', 'integer'],
      result: 'boolean',
      description:
        'Is the first integer numerically greater than or equal to the second?',
    },
    argStructure: [['intExpression', [2, 2]]],
  },
  le: {
    regex: xre('^<=\\((.+)\\)$'),
    doc: {
      operator: '<=',
      args: ['integer', 'integer'],
      result: 'boolean',
      description:
        'Is the first integer numerically less than or equal to the second?',
    },
    argStructure: [['intExpression', [2, 2]]],
  },
  stringPrimitive: {
    regex: xre("^('([^']|\\\\')*')$"),
    parseFunctions: [null, 'quotedString'],
  },
  intPrimitive: {
    regex: xre('^(-?[0-9]+)$'),
    parseFunctions: [null, 'int'],
  },
  booleanPrimitive: {
    regex: xre('^(true)|(false)$'),
    parseFunctions: [null, 'true', 'false'],
  },
};

const parseRegexExpression = (
  docSet,
  node,
  predicateString,
  expressionId,
  matches
) => {
  // console.log(`parseRegexExpression ${predicateString} ${expressionId} ${matches}`);
  const expressionRecord = expressions[expressionId];

  if (!expressionRecord) {
    throw new Error(
      `Unknown expression ${expressionId} for predicate ${predicateString}`
    );
  }

  const nExpectedArgs = (structure) => [
    structure.map((a) => a[1][0]).reduce((a, b) => a + b),
    structure.filter((a) => a[1][1] === null).length > 0,
  ];

  if (expressionRecord.parseFunctions) {
    let found = false;

    for (const [
      n,
      parseFunction,
    ] of expressionRecord.parseFunctions.entries()) {
      if (!parseFunction || !matches[n]) {
        continue;
      }
      found = true;
      return { data: parseFunctions[parseFunction](matches[n]) };
    }

    if (!found) {
      return { errors: `Could not parse predicate ${predicateString}` };
    }
  } else {
    const argRecords = splitArgs(matches[1]);
    const argStructure = expressionRecord.argStructure;
    const argResults = [];

    if (argStructure.length > 0) {
      const nExpected = nExpectedArgs(argStructure);

      if (argRecords.length < nExpected[0]) {
        return {
          errors: `Expected at least ${nExpected[0]} args for '${expressionId}', found ${argRecords.length}`,
        };
      }

      if (!nExpected[1] && argRecords.length > nExpected[0]) {
        return {
          errors: `Expected at most ${nExpected[0]} args for '${expressionId}', found ${argRecords.length}`,
        };
      }

      let argRecordN = 0;
      let argStructureN = 0;
      let nOccs = 0;

      while (argRecordN < argRecords.length) {
        const argRecord = argRecords[argRecordN];
        const argResult = parseExpression(
          docSet,
          node,
          argRecord,
          argStructure[argStructureN][0]
        );

        if (
          'breakOn' in expressionRecord &&
          !argRecord.errors &&
          argResult.data === expressionRecord.breakOn
        ) {
          return argResult;
        }
        argResults.push(argResult);
        argRecordN++;
        nOccs++;

        if (
          argStructure[argStructureN][1][1] &&
          nOccs >= argStructure[argStructureN][1][1]
        ) {
          argStructureN++;
          nOccs = 0;
        }
      }
    }

    if (argResults.filter((ar) => ar.errors).length === 0) {
      // console.log(expressionId);
      const args = argResults.map((ar) => ar.data);
      const aggregated = aggregateFunctions[expressionId](
        docSet,
        node,
        ...args
      );
      // console.log('aggregated', expressionId, argRecords, aggregated);
      return { data: aggregated };
    }
    return {
      errors: `Could not parse arguments to ${expressionId}: ${argRecords
        .filter((ar) => ar.errors)
        .map((ar) => ar.errors)
        .join('; ')}`,
    };
  }
};

const parseExpression = (docSet, node, predicate, expressionId) => {
  // console.log(`parseExpression ${predicate}, ${expressionId}`);
  const expressionRecord = expressions[expressionId];

  if (!expressionRecord) {
    throw new Error(
      `Unknown expression ${expressionId} for predicate ${predicate}`
    );
  }

  if (expressionRecord.oneOf) {
    let errors = null;

    for (const option of expressionRecord.oneOf) {
      const optionResult = parseExpression(docSet, node, predicate, option);

      if (!optionResult.errors) {
        return optionResult;
      } else if (!errors || optionResult.errors.length < errors.length) {
        errors = optionResult.errors;
      }
    }
    return { errors: errors };
  } else {
    const matches = xre.exec(predicate, expressionRecord.regex);

    if (matches) {
      const reResult = parseRegexExpression(
        docSet,
        node,
        predicate,
        expressionId,
        matches
      );
      return reResult;
    } else {
      return { errors: `Could not match ${predicate}` };
    }
  }
};

const doPredicate = (docSet, result, predicateString) => ({
  data: result.data.filter((node) => {
    const nodeResult = parseExpression(
      docSet,
      node,
      predicateString,
      'booleanExpression'
    );

    // console.log();
    if (nodeResult.errors) {
      throw new Error(`Predicate - ${nodeResult.errors}`);
    }
    return nodeResult.data;
  }),
});

export { expressions, doPredicate };
