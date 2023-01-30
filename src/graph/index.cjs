const {
  keyValueSchemaString,
  keyValueResolvers,
} = require('./queries/key_value.cjs');
const {
  cvSchemaString,
  cvResolvers,
} = require('./queries/cv.cjs');
const {
  idPartsSchemaString,
  idPartsResolvers,
} = require('./queries/idParts.cjs');
const { inputAttSpecSchemaString } = require('./queries/input_att_spec.cjs');
const { keyMatchesSchemaString } = require('./queries/input_key_matches.cjs');
const { inputKeyValueSchemaString } = require('./queries/input_key_value.cjs');
const { keyValuesSchemaString } = require('./queries/input_key_values.cjs');
const { inputItemObjectSchemaString } = require('./queries/inputItemObject.cjs');
const {
  itemSchemaString,
  itemResolvers,
} = require('./queries/item.cjs');
const {
  itemGroupSchemaString,
  itemGroupResolvers,
} = require('./queries/itemGroup.cjs');
const {
  kvEntrySchemaString,
  kvEntryResolvers,
} = require('./queries/kv_entry.cjs');
const {
  regexIndexSchemaString,
  regexIndexResolvers,
} = require('./queries/regex_index.cjs');
const { rowEqualsSpecSchemaString } = require('./queries/row_equals_spec.cjs');
const { rowMatchSpecSchemaString } = require('./queries/row_match_spec.cjs');
const { verseRangeSchemaString } = require('./queries/verseRange.cjs');
const { origSchemaString } = require('./queries/orig.cjs');
const {
  verseNumberSchemaString,
  verseNumberResolvers,
} = require('./queries/verseNumber.cjs');
const {
  cellSchemaString,
  cellResolvers,
} = require('./queries/cell.cjs');
const {
  cIndexSchemaString,
  cIndexResolvers,
} = require('./queries/cIndex.cjs');
const {
  cvVerseElementSchemaString,
  cvVerseElementResolvers,
} = require('./queries/cvVerseElement.cjs');
const {
  cvVersesSchemaString,
  cvVersesResolvers,
} = require('./queries/cvVerses.cjs');
const {
  cvIndexSchemaString,
  cvIndexResolvers,
} = require('./queries/cvIndex.cjs');
const {
  cvNavigationSchemaString,
  cvNavigationResolvers,
} = require('./queries/cvNavigation.cjs');
const { inputBlockSpecSchemaString } = require('./queries/inputBlockSpec.cjs');
const {
  nodeSchemaString,
  nodeResolvers,
} = require('./queries/node.cjs');
const {
  kvSequenceSchemaString,
  kvSequenceResolvers,
} = require('./queries/kv_sequence.cjs');
const {
  tableSequenceSchemaString,
  tableSequenceResolvers,
} = require('./queries/table_sequence.cjs');
const {
  treeSequenceSchemaString,
  treeSequenceResolvers,
} = require('./queries/tree_sequence.cjs');
const {
  blockSchemaString,
  blockResolvers,
} = require('./queries/block.cjs');
const {
  sequenceSchemaString,
  sequenceResolvers,
} = require('./queries/sequence.cjs');
const {
  documentSchemaString,
  documentResolvers,
} = require('./queries/document.cjs');
const {
  docSetSchemaString,
  docSetResolvers,
} = require('./queries/doc_set.cjs');
const {
  querySchemaString,
  queryResolvers,
} = require('./queries/index.cjs');
const {
  selectorSpecSchemaString,
  selectorSpecResolvers,
} = require('./queries/selector_spec.cjs');
const { inputSelectorSpecSchemaString } = require('./queries/input_selector_spec.cjs');
const {
  mutationsSchemaString,
  mutationsResolvers,
} = require('./mutations/index.cjs');
const {
  versificationSchemaString,
  versificationResolvers,
} = require('./queries/versification.cjs');
const {
  cvBookSchemaString,
  cvBookResolvers,
} = require('./queries/cvBook.cjs');
const {
  cvChapterSchemaString,
  cvChapterResolvers,
} = require('./queries/cvChapter.cjs');

const typeDefs = `
      ${querySchemaString}
      ${mutationsSchemaString}
      ${keyValueSchemaString}
      ${cvSchemaString}
      ${idPartsSchemaString}
      ${inputAttSpecSchemaString}
      ${keyMatchesSchemaString}
      ${inputKeyValueSchemaString}
      ${keyValuesSchemaString}
      ${inputItemObjectSchemaString}
      ${itemSchemaString}
      ${itemGroupSchemaString}
      ${kvEntrySchemaString}
      ${regexIndexSchemaString}
      ${rowEqualsSpecSchemaString}
      ${rowMatchSpecSchemaString}
      ${verseRangeSchemaString}
      ${origSchemaString}
      ${verseNumberSchemaString}
      ${cellSchemaString}
      ${cIndexSchemaString}
      ${cvVerseElementSchemaString}
      ${cvVersesSchemaString}
      ${cvIndexSchemaString}
      ${cvNavigationSchemaString}
      ${inputBlockSpecSchemaString}
      ${nodeSchemaString}
      ${kvSequenceSchemaString}
      ${tableSequenceSchemaString}
      ${treeSequenceSchemaString}
      ${blockSchemaString}
      ${sequenceSchemaString}
      ${documentSchemaString}
      ${docSetSchemaString}
      ${selectorSpecSchemaString}
      ${inputSelectorSpecSchemaString}
      ${versificationSchemaString}
      ${cvBookSchemaString}
      ${cvChapterSchemaString}
  `;

const resolvers = {
  Mutation: mutationsResolvers,
  Query: queryResolvers,
  KeyValue: keyValueResolvers,
  cv: cvResolvers,
  idParts: idPartsResolvers,
  Item: itemResolvers,
  ItemGroup: itemGroupResolvers,
  kvEntry: kvEntryResolvers,
  regexIndex: regexIndexResolvers,
  verseNumber: verseNumberResolvers,
  cell: cellResolvers,
  cIndex: cIndexResolvers,
  cvVerseElement: cvVerseElementResolvers,
  cvVerses: cvVersesResolvers,
  cvIndex: cvIndexResolvers,
  cvNavigation: cvNavigationResolvers,
  node: nodeResolvers,
  kvSequence: kvSequenceResolvers,
  tableSequence: tableSequenceResolvers,
  treeSequence: treeSequenceResolvers,
  Block: blockResolvers,
  Sequence: sequenceResolvers,
  Document: documentResolvers,
  DocSet: docSetResolvers,
  selectorSpec: selectorSpecResolvers,
  versification: versificationResolvers,
  cvBook: cvBookResolvers,
  cvChapter: cvChapterResolvers,
};

module.exports = {
  typeDefs,
  resolvers,
};
