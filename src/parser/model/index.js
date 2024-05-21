import utils from '../../util';
const ByteArray = utils.ByteArray;
const {
  pushSuccinctGraftBytes,
  pushSuccinctScopeBytes,
  pushSuccinctTokenBytes,
} = utils.succinct;
const { addTag } = utils.tags;
const { labelForScope } = utils.scopeDefs;
const { itemEnum } = utils.itemDefs;
const { scopeEnum } = utils.scopeDefs;
const { tokenCategory, tokenEnum } = utils.tokenDefs;

const Sequence = class {
  constructor(sType) {
    this.id = utils.generateId();
    this.type = sType;
    this.tags = new Set([]);
    this.blocks = [];
    this.activeScopes = [];
  }

  addTag(tag) {
    addTag(this.tags, tag);
  }

  plainText() {
    return this.blocks
      .map((b) => b.plainText())
      .join('')
      .trim();
  }

  addItem(i) {
    this.lastBlock().addItem(i);
  }

  addBlockGraft(g) {
    this.newBlock('hangingGraft');
    this.lastBlock().bg.push(g);
  }

  lastBlock() {
    if (this.blocks.length === 0) {
      this.newBlock('orphanTokens');
    }
    return this.blocks[this.blocks.length - 1];
  }

  newBlock(label) {
    if (
      this.blocks.length > 0 &&
      ['orphanTokens', 'hangingGraft'].includes(
        this.blocks[this.blocks.length - 1].bs.payload
      )
    ) {
      this.lastBlock().bs = {
        type: 'scope',
        subType: 'start',
        payload: label,
      };
    } else {
      this.blocks.push(new Block(label));
    }
  }

  trim() {
    this.blocks.forEach((b) => b.trim());
  }

  reorderSpanWithAtts() {
    this.blocks.forEach((b) => b.reorderSpanWithAtts());
  }

  makeNoteGrafts(parser) {
    this.blocks.forEach((b) => b.makeNoteGrafts(parser));
  }

  close(parser) {
    for (const activeScope of this.activeScopes.filter(() => true).reverse()) {
      this.closeActiveScope(parser, activeScope);
    }
    this.activeScopes = [];
  }

  closeActiveScope(parser, sc) {
    this.addItem({
      type: 'scope',
      subType: 'end',
      payload: sc.label,
    });

    if (sc.onEnd) {
      sc.onEnd(parser, sc.label);
    }
  }

  filterGrafts(options) {
    return this.blocks
      .map((b) => b.filterGrafts(options))
      .reduce((acc, current) => acc.concat(current), []);
  }

  filterScopes(options) {
    this.blocks.forEach((b) => b.filterScopes(options));
  }

  text() {
    return this.blocks.map((b) => b.text()).join('');
  }

  addTableScopes() {
    let inTable = false;

    for (const [blockNo, block] of this.blocks.entries()) {
      if (!inTable && block.bs.payload === 'blockTag/tr') {
        inTable = true;
        this.blocks[blockNo].items.unshift({
          type: 'scope',
          subType: 'start',
          payload: labelForScope('table', []),
        });
      } else if (inTable && block.bs.payload !== 'blockTag/tr') {
        inTable = false;
        this.blocks[blockNo - 1].items.push({
          type: 'scope',
          subType: 'end',
          payload: labelForScope('table', []),
        });
      }
    }

    if (inTable) {
      this.lastBlock().items.push({
        type: 'scope',
        subType: 'end',
        payload: labelForScope('table', []),
      });
    }
  }

  graftifyIntroductionHeadings(parser) {
    let blockEntries = [...this.blocks.entries()];
    blockEntries.reverse();
    const introHeadingTags = ['iot', 'is'].concat(
      parser.customTags.introHeading
    );

    for (const [n, block] of blockEntries) {
      const blockTag = block.bs.payload.split('/')[1].replace(/[0-9]/g, '');

      if (introHeadingTags.includes(blockTag)) {
        const headingSequence = new Sequence('heading');
        parser.sequences.heading.push(headingSequence);
        headingSequence.blocks.push(block);
        const headingGraft = {
          type: 'graft',
          subType: 'heading',
          payload: headingSequence.id,
        };

        if (this.blocks.length < n + 2) {
          this.newBlock('blockTag/hangingGraft');
        }
        this.blocks[n + 1].bg.unshift(headingGraft);
        this.blocks.splice(n, 1);
      } else if (blockTag.startsWith('imt')) {
        const titleType = blockTag.startsWith('imte')
          ? 'introEndTitle'
          : 'introTitle';
        let titleSequence;

        if (parser.sequences[titleType]) {
          titleSequence = parser.sequences[titleType];
        } else {
          const graftType = blockTag.startsWith('imte') ? 'endTitle' : 'title';
          titleSequence = new Sequence(graftType);
          parser.sequences[titleType] = titleSequence;
          const titleGraft = {
            type: 'graft',
            subType: graftType,
            payload: titleSequence.id,
          };

          if (this.blocks.length < n + 2) {
            this.newBlock('blockTag/hangingGraft');
          }
          this.blocks[n + 1].bg.unshift(titleGraft);
        }
        this.blocks.splice(n, 1);
        titleSequence.blocks.unshift(block);
      }
    }
  }

  moveOrphanScopes() {
    if (this.blocks.length > 1) {
      this.moveOrphanStartScopes();
      this.moveOrphanEndScopes();
    }
  }

  moveOrphanStartScopes() {
    for (const [blockNo, block] of this.blocks.entries()) {
      if (blockNo >= this.blocks.length - 1) {
        continue;
      }

      for (const item of [...block.items].reverse()) {
        if (item.subType !== 'start' || item.payload.startsWith('altChapter')) {
          break;
        }
        this.blocks[blockNo + 1].items.unshift(
          this.blocks[blockNo].items.pop()
        );
      }
    }
  }

  moveOrphanStartScopes2() {
    for (const [blockNo, block] of this.blocks.entries()) {
      if (blockNo >= this.blocks.length - 1) {
        continue;
      }

      for (const item of [...block.items].reverse()) {
        if (item.subType !== 'start') {
          break;
        }
        this.blocks[blockNo + 1].items.unshift(
          this.blocks[blockNo].items.pop()
        );
      }
    }
  }

  moveOrphanEndScopes() {
    for (const [blockNo, block] of this.blocks.entries()) {
      if (blockNo === 0) {
        continue;
      }

      for (const item of [...block.items]) {
        if (item.subType !== 'end') {
          break;
        }
        this.blocks[blockNo - 1].items.push(this.blocks[blockNo].items.shift());
      }
    }
  }

  removeEmptyBlocks(customCanBeEmpty) {
    const canBeEmpty = ['blockTag/b', 'blockTag/ib'].concat(customCanBeEmpty);
    const emptyBlocks = [];
    let changed = false;

    const emptyMilestones = blockItems => {
      const milestoneScopes = blockItems.filter(i => i.type === "scope" && i.payload.startsWith("milestone"));
      const startMilestones = new Set([]);
      for (const milestoneScope of milestoneScopes) {
        if (milestoneScope.subType === "start") {
          startMilestones.add(milestoneScope.payload);
        } else if (startMilestones.has(milestoneScope.payload)) {
          return true;
        }
      }
      return false;
    }
    for (const blockRecord of this.blocks.entries()) {
      if (
        blockRecord[1].tokens().length === 0 &&
        !emptyMilestones(blockRecord[1].items) &&
        !canBeEmpty.includes(blockRecord[1].bs.payload)
      ) {
        emptyBlocks.push(blockRecord);
      }
    }

    for (const [n, block] of emptyBlocks.reverse()) {
      if (n < this.blocks.length - 1) {
        for (const bg of [...block.bg].reverse()) {
          this.blocks[n + 1].bg.unshift(bg);
        }

        for (const i of block.items.reverse()) {
          this.blocks[n + 1].items.unshift(i);
        }
        this.blocks.splice(n, 1);
        changed = true;
      } else if (block.bg.length === 0 && block.items.length === 0) {
        this.blocks.splice(n, 1);
        changed = true;
      }
    }

    if (changed) {
      this.removeEmptyBlocks(customCanBeEmpty);
    }
  }

  removeGraftsToEmptySequences(emptySequences) {
    this.blocks.forEach((b) => b.removeGraftsToEmptySequences(emptySequences));
  }

  succinctifyBlocks(docSet) {
    const ret = [];
    let openScopes = [];

    const updateOpenScopes = (item) => {
      if (item.subType === 'start') {
        const existingScopes = openScopes.filter(
          (s) => s.payload === item.payload
        );

        if (existingScopes.length === 0) {
          openScopes.push(item);
        }
      } else {
        openScopes = openScopes.filter((s) => s.payload !== item.payload);
      }
    };

    let nextToken = 0;

    for (const block of this.blocks) {
      const contentBA = new ByteArray(block.length);
      const blockGraftsBA = new ByteArray(1);
      const openScopesBA = new ByteArray(1);
      const includedScopesBA = new ByteArray(1);
      const nextTokenBA = new ByteArray(1);

      nextTokenBA.pushNByte(nextToken);

      for (const bg of block.bg) {
        this.pushSuccinctGraft(blockGraftsBA, docSet, bg);
      }

      for (const os of openScopes) {
        this.pushSuccinctScope(openScopesBA, docSet, os);
      }

      const includedScopes = [];

      for (const item of block.items) {
        switch (item.type) {
          case 'token':
            this.pushSuccinctToken(contentBA, docSet, item);

            if (item.subType === 'wordLike') {
              nextToken++;
            }
            break;
          case 'graft':
            this.pushSuccinctGraft(contentBA, docSet, item);
            break;
          case 'scope':
            this.pushSuccinctScope(contentBA, docSet, item);
            updateOpenScopes(item);

            if (item.subType === 'start') {
              includedScopes.push(item);
            }
            break;
          default:
            throw new Error(
              `Item type ${item.type} is not handled in succinctifyBlocks`
            );
        }
      }

      const blockScopeBA = new ByteArray(10);
      this.pushSuccinctScope(blockScopeBA, docSet, block.bs);

      for (const is of includedScopes) {
        this.pushSuccinctScope(includedScopesBA, docSet, is);
      }
      contentBA.trim();
      blockGraftsBA.trim();
      blockScopeBA.trim();
      openScopesBA.trim();
      includedScopesBA.trim();
      ret.push({
        c: contentBA,
        bs: blockScopeBA,
        bg: blockGraftsBA,
        os: openScopesBA,
        is: includedScopesBA,
        nt: nextTokenBA,
      });
    }
    return ret;
  }

  pushSuccinctToken(bA, docSet, item) {
    const charsEnumIndex = docSet.enumForCategoryValue(
      tokenCategory[item.subType],
      item.payload
    );
    pushSuccinctTokenBytes(bA, tokenEnum[item.subType], charsEnumIndex);
  }

  pushSuccinctGraft(bA, docSet, item) {
    const graftTypeEnumIndex = docSet.enumForCategoryValue(
      'graftTypes',
      item.subType
    );
    const seqEnumIndex = docSet.enumForCategoryValue('ids', item.payload);
    pushSuccinctGraftBytes(bA, graftTypeEnumIndex, seqEnumIndex);
  }

  pushSuccinctScope(bA, docSet, item) {
    const scopeBits = item.payload.split('/');
    const scopeTypeByte = scopeEnum[scopeBits[0]];
    const scopeBitBytes = scopeBits
      .slice(1)
      .map((b) => docSet.enumForCategoryValue('scopeBits', b));
    pushSuccinctScopeBytes(
      bA,
      itemEnum[`${item.subType}Scope`],
      scopeTypeByte,
      scopeBitBytes
    );
  }
};
const Block = class {
  constructor(blockScope) {
    this.id = utils.generateId();
    this.items = [];
    this.bg = [];
    this.bs = {
      type: 'scope',
      subType: 'start',
      payload: blockScope,
    };
    this.os = [];
  }

  addItem(i) {
    this.items.push(i);
  }

  plainText() {
    return this.items
      .filter((i) => i.type === 'token')
      .map((i) => i.payload)
      .join('');
  }

  trim() {
    this.items = this.trimEnd(this.trimStart(this.items));
  }

  reorderSpanWithAtts() {
    const swaStarts = [];

    for (const [pos, item] of this.items.entries()) {
      if (item.subType === 'start' && item.payload.startsWith('spanWithAtts')) {
        swaStarts.push(pos + 1);
      }
    }

    for (const swaStart of swaStarts) {
      let pos = swaStart;
      let tokens = [];
      let scopes = [];

      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (pos >= this.items.length) {
          break;
        }

        const item = this.items[pos];

        if (item.type === 'token') {
          tokens.push(item);
        } else if (
          item.subType === 'start' &&
          item.payload.startsWith('attribute/spanWithAtts')
        ) {
          scopes.push(item);
        } else {
          break;
        }
        pos++;
      }

      if (tokens.length !== 0 && scopes.length !== 0) {
        let pos = swaStart;

        for (const s of scopes) {
          this.items[pos] = s;
          pos++;
        }

        for (const t of tokens) {
          this.items[pos] = t;
          pos++;
        }
      }
    }
  }

  inlineToEnd() {
    let toAppend = null;

    for (const [pos, item] of this.items.entries()) {
      if (
        item.subType === 'end' &&
        ['inline/f', 'inline/fe', 'inline/x'].includes(item.payload)
      ) {
        toAppend = item;
        this.items.splice(pos, 1);
        break;
      }
    }

    if (toAppend) {
      this.addItem(toAppend);
    }
  }

  makeNoteGrafts(parser) {
    const noteStarts = [];

    for (const [pos, item] of this.items.entries()) {
      if (
        item.subType === 'start' &&
        (item.payload.startsWith('inline/f') ||
          item.payload.startsWith('inline/x'))
      ) {
        noteStarts.push(pos);
      }
    }

    for (const noteStart of noteStarts) {
      const noteLabel = this.items[noteStart].payload;
      const callerToken = this.items[noteStart + 1];

      if (callerToken.type === 'token' && callerToken.payload.length === 1) {
        const callerSequence = new Sequence('noteCaller');
        callerSequence.newBlock(noteLabel);
        callerSequence.addItem(callerToken);
        parser.sequences.noteCaller.push(callerSequence);
        this.items[noteStart + 1] = {
          type: 'graft',
          subType: 'noteCaller',
          payload: callerSequence.id,
        };
      }
    }
  }

  trimStart(items) {
    if (items.length === 0) {
      return items;
    }

    const firstItem = items[0];

    if (['lineSpace', 'eol'].includes(firstItem.subType)) {
      return this.trimStart(items.slice(1));
    }

    if (firstItem.type === 'token') {
      return items;
    }
    return [firstItem, ...this.trimStart(items.slice(1))];
  }

  trimEnd(items) {
    if (items.length === 0) {
      return items;
    }

    const lastItem = items[items.length - 1];

    if (['lineSpace', 'eol'].includes(lastItem.subType)) {
      return this.trimEnd(items.slice(0, items.length - 1));
    }

    if (lastItem.type === 'token') {
      return items;
    }
    return [...this.trimEnd(items.slice(0, items.length - 1)), lastItem];
  }

  filterGrafts(options) {
    // Each graft should be removed or returned
    const ret = [];
    let toRemove = [];

    for (const [pos, item] of this.grafts()) {
      if (this.graftPassesOptions(item, options)) {
        ret.push(item.payload);
      } else {
        toRemove.push(pos);
      }
    }

    for (const [count, pos] of Array.from(toRemove.entries())) {
      this.items.splice(pos - count, 1);
    }
    toRemove = [];

    for (const [pos, item] of this.bg.entries()) {
      if (this.graftPassesOptions(item, options)) {
        ret.push(item.payload);
      } else {
        toRemove.push(pos);
      }
    }

    for (const [count, pos] of Array.from(toRemove.entries())) {
      this.bg.splice(pos - count, 1);
    }
    return ret;
  }

  filterScopes(options) {
    const toRemove = [];

    for (const [pos, item] of this.scopes()) {
      if (!this.scopePassesOptions(item, options)) {
        toRemove.push(pos);
      }
    }

    for (const [count, pos] of Array.from(toRemove.entries())) {
      this.items.splice(pos - count, 1);
    }
  }

  graftPassesOptions(item, options) {
    return (
      (!('includeGrafts' in options) ||
        options.includeGrafts.includes(item.subType)) &&
      (!('excludeGrafts' in options) ||
        !options.excludeGrafts.includes(item.subType))
    );
  }

  scopePassesOptions(item, options) {
    return (
      (!('includeScopes' in options) ||
        this.scopeMatchesOptionArray(item.payload, options.includeScopes)) &&
      (!('excludeScopes' in options) ||
        !this.scopeMatchesOptionArray(item.payload, options.excludeScopes))
    );
  }

  scopeMatchesOptionArray(itemString, optionArray) {
    for (const optionString of optionArray) {
      if (itemString.startsWith(optionString)) {
        return true;
      }
    }
    return false;
  }

  removeGraftsToEmptySequences(emptySequences) {
    const ret = [];
    let toRemove = [];

    for (const [pos, item] of this.grafts()) {
      if (emptySequences.includes(item.payload)) {
        toRemove.push(pos);
      }
    }

    for (const [count, pos] of Array.from(toRemove.entries())) {
      this.items.splice(pos - count, 1);
    }
    toRemove = [];

    for (const [pos, item] of this.bg.entries()) {
      if (emptySequences.includes(item.payload)) {
        toRemove.push(pos);
      }
    }

    for (const [count, pos] of Array.from(toRemove.entries())) {
      this.bg.splice(pos - count, 1);
    }
    return ret;
  }

  grafts() {
    return Array.from(this.items.entries()).filter(
      (ip) => ip[1].type === 'graft'
    );
  }

  scopes() {
    return Array.from(this.items.entries()).filter(
      (ip) => ip[1].type === 'scope'
    );
  }

  tokens() {
    return Array.from(this.items.entries()).filter(
      (ip) => !['scope', 'graft'].includes(ip[1].type)
    );
  }

  text() {
    return this.tokens()
      .map((t) => t[1].payload)
      .join('');
  }
};

export { Sequence, Block };
