/* eslint-disable no-unused-vars */
const checksum = require('checksum');
const utils = require('../util/index.cjs');
const ByteArray = utils.ByteArray;
const {
  addTag, removeTag, validateTags,
} = utils.tags;
const {
  succinctGraftName,
  succinctGraftSeqId,
  succinctScopeLabel,
  succinctTokenChars,
  headerBytes,
  enumIndex,
  enumIndexes,
} = utils.succinct;
const { itemEnum } = utils.itemDefs;
const { tokenEnumLabels } = utils.tokenDefs;
const { validateSelectors } = require('./doc_set_helpers/selectors.cjs');
const {
  blocksWithScriptureCV,
  allBlockScopes,
  anyScopeInBlock,
  allScopesInBlock,
  blockHasBlockScope,
  blockHasChars,
  blockHasMatchingItem,
} = require('./doc_set_helpers/block.cjs');
const {
  unsuccinctifyBlock,
  unsuccinctifyItems,
  unsuccinctifyItem,
  unsuccinctifyPrunedItems,
  unsuccinctifyItemsWithScriptureCV,
} = require('./doc_set_helpers/unsuccinctify.cjs');
const {
  buildPreEnum,
  recordPreEnum,
  buildEnum,
  enumForCategoryValue,
} = require('./doc_set_helpers/enum.cjs');
const {
  countItems,
  itemsByIndex,
  sequenceItemsByScopes,
  sequenceItemsByMilestones,
} = require('./doc_set_helpers/item.cjs');
const {
  rehash,
  makeRehashEnumMap,
} = require('./doc_set_helpers/rehash.cjs');
const {
  updateItems,
  updateBlockGrafts,
  updateBlockScope,
  updateOpenScopes,
  updateIncludedScopes,
  updateBlockIndexesAfterEdit,
  updateBlockIndexesAfterFilter,
} = require('./doc_set_helpers/update.cjs');
const { serializeSuccinct } = require('./doc_set_helpers/serialize.cjs');
class DocSet {
  constructor(processor, selectors, tags, succinctJson) {
    this.processor = processor;
    this.preEnums = {};
    this.enumIndexes = {};
    this.docIds = [];

    if (succinctJson) {
      this.fromSuccinct(processor, succinctJson);
    } else {
      this.fromScratch(processor, selectors, tags);
    }
    validateTags(this.tags);
  }

  fromScratch(processor, selectors, tags) {
    const defaultedSelectors = selectors || processor.selectors;
    this.selectors = validateSelectors(this, defaultedSelectors);
    this.id = this.selectorString();
    this.tags = new Set(tags || []);
    this.enums = {
      ids: new ByteArray(512),
      wordLike: new ByteArray(8192),
      notWordLike: new ByteArray(256),
      scopeBits: new ByteArray(256),
      graftTypes: new ByteArray(10),
    };
  }

  fromSuccinct(processor, succinctJson) {
    const populatedByteArray = (succinct) => {
      const ret = new ByteArray(256);
      ret.fromBase64(succinct);
      ret.trim();
      return ret;
    };

    this.id = succinctJson.id;
    this.selectors = validateSelectors(this, succinctJson.metadata.selectors);
    this.tags = new Set(succinctJson.tags);
    validateTags(this.tags);
    this.preEnums = {};
    this.enums = {
      ids: populatedByteArray(succinctJson.enums.ids),
      wordLike: populatedByteArray(succinctJson.enums.wordLike),
      notWordLike: populatedByteArray(succinctJson.enums.notWordLike),
      scopeBits: populatedByteArray(succinctJson.enums.scopeBits),
      graftTypes: populatedByteArray(succinctJson.enums.graftTypes),
    };
    this.enumIndexes = {};
    this.docIds = [];
  }

  addTag(tag) {
    addTag(this.tags, tag);
  }

  removeTag(tag) {
    removeTag(this.tags, tag);
  }

  selectorString() {
    return this.processor.selectorString(this.selectors);
  }

  documents() {
    return this.docIds.map(did => this.processor.documents[did]);
  }

  documentWithBook(bookCode) {
    const docsWithBook = Object.values(this.documents()).filter(doc => 'bookCode' in doc.headers && doc.headers['bookCode'] === bookCode);
    return docsWithBook.length === 1 ? docsWithBook[0] : null;
  }

  maybeBuildPreEnums() {
    if (Object.keys(this.preEnums).length === 0) {
      this.buildPreEnums();
    }
  }

  buildPreEnums() {
    for (const [category, succinct] of Object.entries(this.enums)) {
      this.preEnums[category] = buildPreEnum(this, succinct);
    }
  }

  recordPreEnum(category, value) {
    recordPreEnum(this, category, value);
  }

  sortPreEnums() {
    for (const catKey of Object.keys(this.preEnums)) {
      this.preEnums[catKey] = new Map([...this.preEnums[catKey].entries()].sort((a, b) => b[1].frequency - a[1].frequency));

      let count = 0;

      for (const [k, v] of this.preEnums[catKey]) {
        v.enum = count++;
      }
    }
  }

  enumForCategoryValue(category, value, addUnknown) {
    return enumForCategoryValue(this, category, value, addUnknown);
  }

  buildEnums() {
    for (const [category, catOb] of Object.entries(this.preEnums)) {
      this.enums[category].clear();
      this.buildEnum(category, catOb);
    }
  }

  buildEnum(category, preEnumOb) {
    buildEnum(this, category, preEnumOb);
  }

  maybeBuildEnumIndexes() {
    if (Object.keys(this.enumIndexes).length === 0) {
      this.buildEnumIndexes();
    }
  }

  buildEnumIndexes() {
    this.enumIndexes = enumIndexes(this.enums);
  }

  buildEnumIndex(category) {
    this.enumIndexes[category] = enumIndex(category, this.enums[category]);
  }

  unsuccinctifyBlock(block, options) {
    return unsuccinctifyBlock(this, block, options);
  }

  unsuccinctifyItems(succinct, options, nextToken, openScopes) {
    return unsuccinctifyItems(this, succinct, options, nextToken, openScopes);
  }

  unsuccinctifyItem(succinct, pos, options) {
    return unsuccinctifyItem(this, succinct, pos, options);
  }

  unsuccinctifyPrunedItems(block, options) {
    return unsuccinctifyPrunedItems(this, block, options);
  }

  unsuccinctifyScopes(succinct) {
    const ret = [];
    let pos = 0;

    while (pos < succinct.length) {
      const [itemLength, itemType, itemSubtype] = headerBytes(succinct, pos);
      ret.push(this.unsuccinctifyScope(succinct, itemType, itemSubtype, pos));
      pos += itemLength;
    }
    return ret;
  }

  unsuccinctifyGrafts(succinct) {
    const ret = [];
    let pos = 0;

    while (pos < succinct.length) {
      const [itemLength, itemType, itemSubtype] = headerBytes(succinct, pos);
      ret.push(this.unsuccinctifyGraft(succinct, itemSubtype, pos));
      pos += itemLength;
    }
    return ret;
  }

  unsuccinctifyToken(succinct, itemSubtype, pos) {
    try {
      return [
        'token',
        tokenEnumLabels[itemSubtype],
        this.succinctTokenChars(succinct, itemSubtype, pos),
      ];
    } catch (err) {
      throw new Error(`Error from unsuccinctifyToken: ${err}`);
    }
  }

  unsuccinctifyScope(succinct, itemType, itemSubtype, pos) {
    try {
      return [
        'scope',
        (itemType === itemEnum.startScope) ? 'start' : 'end',
        this.succinctScopeLabel(succinct, itemSubtype, pos),
      ];
    } catch (err) {
      throw new Error(`Error from unsuccinctifyScope: ${err}`);
    }
  }

  unsuccinctifyGraft(succinct, itemSubtype, pos) {
    try {
      return [
        'graft',
        this.succinctGraftName(itemSubtype),
        this.succinctGraftSeqId(succinct, pos),
      ];
    } catch (err) {
      throw new Error(`Error from unsuccinctifyGraft: ${err}`);
    }
  }

  unsuccinctifyBlockScopeLabelsSet(block) {
    const [itemLength, itemType, itemSubtype] = headerBytes(block.bs, 0);
    const blockScope = this.unsuccinctifyScope(block.bs, itemType, itemSubtype, 0);
    return new Set(
      this.unsuccinctifyScopes(block.os).concat(
        this.unsuccinctifyScopes(block.is),
      ).concat([blockScope])
        .map(ri => ri[2]));
  }

  unsuccinctifyItemsWithScriptureCV(block, cv, options) {
    return unsuccinctifyItemsWithScriptureCV(this, block, cv, options);
  }

  succinctTokenChars(succinct, itemSubtype, pos) {
    return succinctTokenChars(this.enums, this.enumIndexes, succinct, itemSubtype, pos);
  }

  succinctScopeLabel(succinct, itemSubtype, pos) {
    return succinctScopeLabel(this.enums, this.enumIndexes, succinct, itemSubtype, pos);
  }

  succinctGraftName(itemSubtype) {
    return succinctGraftName(this.enums, this.enumIndexes, itemSubtype);
  }

  succinctGraftSeqId(succinct, pos) {
    return succinctGraftSeqId(this.enums, this.enumIndexes, succinct, pos);
  }

  countItems(succinct) {
    return countItems(this, succinct);
  }

  itemsByIndex(mainSequence, index, includeContext) {
    return itemsByIndex(this, mainSequence, index, includeContext);
  }

  blocksWithScriptureCV(blocks, cv) {
    return blocksWithScriptureCV(this, blocks, cv);
  }

  allBlockScopes(block) {
    return allBlockScopes(this, block);
  }

  allScopesInBlock(block, scopes) {
    return allScopesInBlock(this, block, scopes);
  }

  anyScopeInBlock(block, scopes) {
    return anyScopeInBlock(this, block, scopes);
  }

  blockHasBlockScope(block, scope) {
    return blockHasBlockScope(this, block, scope);
  }

  blockHasChars(block, charsIndexes) {
    return blockHasChars(this, block, charsIndexes);
  }

  blockHasMatchingItem(block, testFunction, options) {
    return blockHasMatchingItem(this, block, testFunction, options);
  }

  sequenceItemsByScopes(blocks, byScopes) {
    return sequenceItemsByScopes(this, blocks, byScopes);
  }

  sequenceItemsByMilestones(blocks, byMilestones) {
    return sequenceItemsByMilestones(this, blocks, byMilestones);
  }

  rehash() {
    return rehash(this);
  }

  makeRehashEnumMap() {
    return makeRehashEnumMap(this);
  }

  updateItems(documentId, sequenceId, blockPosition, itemObjects) {
    return updateItems(this, documentId, sequenceId, blockPosition, itemObjects);
  }

  updateBlockGrafts(documentId, sequenceId, blockPosition, itemObjects) {
    return updateBlockGrafts(this, documentId, sequenceId, blockPosition, itemObjects);
  }

  updateBlockScope(documentId, sequenceId, blockPosition, bsObject) {
    return updateBlockScope(this, documentId, sequenceId, blockPosition, bsObject);
  }

  updateOpenScopes(documentId, sequenceId, blockPosition, osObjects) {
    return updateOpenScopes(this, documentId, sequenceId, blockPosition, osObjects);
  }

  updateIncludedScopes(documentId, sequenceId, blockPosition, isObjects) {
    return updateIncludedScopes(this, documentId, sequenceId, blockPosition, isObjects);
  }

  updateBlockIndexesAfterEdit(sequence, blockPosition) {
    updateBlockIndexesAfterEdit(this, sequence, blockPosition);
  }

  updateBlockIndexesAfterFilter(sequence) {
    updateBlockIndexesAfterFilter(this, sequence);
  }

  serializeSuccinct() {
    return serializeSuccinct(this);
  }

  checksum() {
    const docIdsString = [...this.docIds].sort().join(' ');
    return checksum(docIdsString);
  }
}

module.exports = { DocSet };
