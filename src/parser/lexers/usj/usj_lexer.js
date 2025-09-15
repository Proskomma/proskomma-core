import xre from 'xregexp';
import { lexingRegexes, mainRegex } from '../lexingRegexes';
import {
  preTokenObjectForFragment,
  constructorForFragment,
} from '../object_for_fragment';

class UsjLexer {
  constructor() {
    this.elementStack = [];
    this.currentText = '';
    this.openTagHandlers = {
      USJ: this.ignoreHandler,
      book: this.handleBookOpen,
      chapter: this.handleChapter,
      verse: this.handleVerses,
      para: this.handleParaOpen,
      table: this.ignoreHandler,
      row: this.handleRowOpen,
      cell: this.handleCellOpen,
      char: this.handleCharOpen,
      ms: this.handleMSOpen,
      note: this.handleNoteOpen,
      sidebar: this.handleSidebarOpen,
      periph: this.notHandledHandler,
      figure: this.handleFigureOpen,
      optbreak: this.handleOptBreakOpen,
      ref: this.ignoreHandler, // this.handleRefOpen,
    };
    this.closeTagHandlers = {
      USJ: this.ignoreHandler,
      book: this.handleBookClose,
      chapter: this.ignoreHandler,
      verse: this.ignoreHandler,
      para: this.handleParaClose,
      table: this.ignoreHandler,
      row: this.handleRowClose,
      cell: this.handleCellClose,
      char: this.handleCharClose,
      ms: this.handleMSClose,
      note: this.handleNoteClose,
      sidebar: this.handleSidebarClose,
      periph: this.notHandledHandler,
      figure: this.handleFigureClose,
      optbreak: this.handleOptBreakClose,
      ref: this.ignoreHandler, // this.handleRefClose,
    };
  }

  lexAndParse(str, parser) {
    this.parser = parser;
    this.elementStack = [];
    let usjJson;
    try {
      usjJson = JSON.parse(str);
    } catch(err) {
      throw new Error(`Error parsing USJ: ${err}`);
    }
    this.walkUsj(usjJson, parser);
  }

  walkUsj(usj, parser, path=[]) {

    const printPath = () => `/${path.join("/")}`;

    if (typeof usj !== "object" || Array.isArray(usj)) {
      throw new Error(`USJ walker expected object at ${printPath()} but found '${JSON.stringify(usj).substring(0, 40) + "..."}'`);
    }
    const nodeType = usj["type"];
    if (!nodeType) {
      throw new Error(`USJ walker did not find type attribute at ${printPath()} in '${JSON.stringify(usj).substring(0, 40) + "..."}'`);
    }
    if (!this.openTagHandlers[nodeType]) {
      throw new Error(`USJ walker found no openTag handler for ${nodeType} at ${printPath()}`);
    }
    if (!this.closeTagHandlers[nodeType]) {
      throw new Error(`USJ walker found no closeTag handler for ${nodeType} at ${printPath()}`);
    }
    let atts = {...usj};
    delete atts["type"];
    delete atts["content"];
    for (const [k, v] of Object.entries(atts)) {
      if (typeof v === "object") {
        throw new Error(`usjWalker expected string or number but found object or array '${JSON.stringify(usj).substring(0, 40) + "..."}' for attribute ${k} at ${printPath()}`);
      }
    }
    this.openTagHandlers[nodeType](this, 'open', nodeType, atts);
    for (const [n, child] of (usj["content"] || []).entries()) {
      if (typeof child === "string") {
        this.handleText(child);
      } else if (typeof child !== "object" || Array.isArray(child)) {
        throw new Error(`USJ walker expected child to be object at ${printPath()} but found '${JSON.stringify(child).substring(0, 40) + "..."}'`);
      } else {
        this.walkUsj(child, parser, [...path, nodeType, n]);
      }
    }
    this.closeTagHandlers[nodeType](this, 'close', nodeType, atts);
  }

  handleText(text) {
    this.currentText = text;
    xre
      .match(this.currentText, mainRegex, 'all')
      .map((f) => preTokenObjectForFragment(f, lexingRegexes))
      .forEach((t) => this.parser.parseItem(t));
  }

  notHandledHandler(lexer, oOrC, tag) {
    console.error(
      `WARNING: ${oOrC} element tag '${tag}' is not handled by UsjParser`
    );
  }

  stackPush(name, atts) {
    this.elementStack.push([name, atts]);
  }

  stackPop() {
    return this.elementStack.pop();
  }

  splitTagNumber(fullTagName) {
    const tagBits = xre.exec(fullTagName, xre('([^1-9]+)(.*)'));
    const tagName = tagBits[1];
    const tagNo = tagBits[2].length > 0 ? tagBits[2] : '1';
    return [tagName, tagNo];
  }

  ignoreHandler(lexer, oOrC, tag) {
    /** TODO */
  }

  handleParaOpen(lexer, oOrC, name, atts) {
    lexer.currentText = '';
    const [tagName, tagNo] = lexer.splitTagNumber(atts.marker);

    if (!['cp'].includes(tagName)) {
      lexer.parser.parseItem(
        constructorForFragment.tag('startTag', [null, null, tagName, tagNo])
      );
    }
    lexer.stackPush(name, atts);
  }

  handleParaClose(lexer) {
    const sAtts = lexer.stackPop()[1];
    const [tagName, tagNo] = lexer.splitTagNumber(sAtts.marker);

    if (['cp'].includes(tagName)) {
      lexer.parser.parseItem(
        constructorForFragment.pubchapter('pubchapter', [
          null,
          null,
          lexer.currentText,
        ])
      );
    } else {
      lexer.parser.parseItem(
        constructorForFragment.tag('endTag', [null, null, tagName, tagNo])
      );
    }
    lexer.currentText = '';
  }

  handleCharOpen(lexer, oOrC, name, atts) {
    const [tagName, tagNo] = lexer.splitTagNumber(atts.marker);
    lexer.parser.parseItem(
      constructorForFragment.tag('startTag', [null, null, `+${tagName}`, tagNo])
    );
    const ignoredAtts = [
      'sid',
      'eid',
      'style',
      'srcloc',
      'link-href',
      'link-title',
      'link-id',
      'closed',
    ];

    for (const [attName, attValue] of Object.entries(atts)) {
      if (!ignoredAtts.includes(attName)) {
        lexer.parser.parseItem(
          constructorForFragment.attribute('attribute', [
            null,
            null,
            attName,
            attValue,
          ])
        );
      }
    }
    lexer.stackPush(name, atts);
  }

  handleCharClose(lexer) {
    const sAtts = lexer.stackPop()[1];
    const [tagName, tagNo] = lexer.splitTagNumber(sAtts.marker);
    lexer.parser.parseItem(
      constructorForFragment.tag('endTag', [null, null, `+${tagName}`, tagNo])
    );
  }

  handleRefOpen(lexer) {
    lexer.parser.parseItem(
      constructorForFragment.tag('startTag', [null, null, 'xt', ''])
    );
  }

  handleRefClose(lexer) {
    lexer.parser.parseItem(
      constructorForFragment.tag('endTag', [null, null, 'xt', ''])
    );
  }

  handleRowOpen(lexer, oOrC, name, atts) {
    const [tagName, tagNo] = lexer.splitTagNumber(atts.marker);
    lexer.parser.parseItem(
      constructorForFragment.tag('startTag', [null, null, tagName, tagNo])
    );
    lexer.stackPush(name, atts);
  }

  handleRowClose(lexer) {
    const sAtts = lexer.stackPop()[1];
    const [tagName, tagNo] = lexer.splitTagNumber(sAtts.marker);
    lexer.parser.parseItem(
      constructorForFragment.tag('endTag', [null, null, tagName, tagNo])
    );
  }

  handleCellOpen(lexer, oOrC, name, atts) {
    const [tagName, tagNo] = lexer.splitTagNumber(atts.marker);
    lexer.parser.parseItem(
      constructorForFragment.tag('startTag', [null, null, tagName, tagNo])
    );
    lexer.stackPush(name, atts);
  }

  handleCellClose(lexer) {
    const sAtts = lexer.stackPop()[1];
    const [tagName, tagNo] = lexer.splitTagNumber(sAtts.marker);
    lexer.parser.parseItem(
      constructorForFragment.tag('endTag', [null, null, tagName, tagNo])
    );
  }

  handleBookOpen(lexer, oOrC, name, atts) {
    lexer.parser.parseItem(
      constructorForFragment.tag('startTag', [null, null, 'id', ''])
    );
    lexer.parser.parseItem(
      constructorForFragment.printable('wordLike', [atts.code])
    );
    lexer.parser.parseItem(
      constructorForFragment.printable('lineSpace', [' '])
    );
    lexer.stackPush(name, atts);
  }

  handleBookClose(lexer) {
    lexer.stackPop();
    lexer.parser.parseItem(
      constructorForFragment.tag('endTag', [null, null, 'id', ''])
    );
  }

  handleChapter(lexer, oOrC, name, atts) {
    if (atts.number) {
      lexer.parser.parseItem(
        constructorForFragment.chapter('chapter', [null, null, atts.number])
      );

      if (atts.pubnumber) {
        lexer.parser.parseItem(
          constructorForFragment.pubchapter('pubchapter', [
            null,
            null,
            atts.pubnumber,
          ])
        );
      }

      if (atts.altnumber) {
        lexer.parser.parseItem(
          constructorForFragment.tag('startTag', [null, null, '+ca', ''])
        );
        lexer.parser.parseItem(
          constructorForFragment.printable('wordLike', [atts.altnumber])
        );
        lexer.parser.parseItem(
          constructorForFragment.tag('endTag', [null, null, '+ca', ''])
        );
      }
    }
  }

  handleVerses(lexer, oOrC, name, atts) {
    if (atts.number) {
      lexer.parser.parseItem(
        constructorForFragment.verses('verses', [null, null, atts.number])
      );

      if (atts.pubnumber) {
        lexer.parser.parseItem(
          constructorForFragment.tag('startTag', [null, null, '+vp', ''])
        );
        lexer.parser.parseItem(
          constructorForFragment.printable('wordLike', [atts.pubnumber])
        );
        lexer.parser.parseItem(
          constructorForFragment.tag('endTag', [null, null, '+vp', ''])
        );
      }

      if (atts.altnumber) {
        lexer.parser.parseItem(
          constructorForFragment.tag('startTag', [null, null, '+va', ''])
        );
        lexer.parser.parseItem(
          constructorForFragment.printable('wordLike', [atts.altnumber])
        );
        lexer.parser.parseItem(
          constructorForFragment.tag('endTag', [null, null, '+va', ''])
        );
      }
    }
  }

  handleNoteOpen(lexer, oOrC, name, atts) {
    lexer.parser.parseItem(
      constructorForFragment.tag('startTag', [null, null, atts.marker, ''])
    );
    lexer.parser.parseItem(
      constructorForFragment.printable('punctuation', [atts.caller])
    );
    lexer.stackPush(name, atts);
  }

  handleNoteClose(lexer) {
    const sAtts = lexer.stackPop()[1];
    lexer.parser.parseItem(
      constructorForFragment.tag('endTag', [null, null, sAtts.marker, ''])
    );
  }

  handleSidebarOpen(lexer, oOrC, name, atts) {
    lexer.parser.parseItem(
      constructorForFragment.tag('startTag', [null, null, 'esb', ''])
    );

    if ('category' in atts) {
      lexer.parser.parseItem(
        constructorForFragment.tag('startTag', [null, null, 'cat', ''])
      );
      lexer.parser.parseItem(
        constructorForFragment.printable('wordLike', [atts.category])
      );
      lexer.parser.parseItem(
        constructorForFragment.tag('endTag', [null, null, 'cat', ''])
      );
    }
    lexer.stackPush(name, atts);
  }

  handleSidebarClose(lexer) {
    lexer.stackPop();
    lexer.parser.parseItem(
      constructorForFragment.tag('startTag', [null, null, 'esbe', ''])
    );
  }

  handleMSOpen(lexer, oOrC, name, atts) {
    let matchBits = xre.exec(atts.marker, xre('(([a-z1-9]+)-([se]))'));

    if (matchBits) {
      const startMS = constructorForFragment.milestone('startMilestoneTag', [
        null,
        null,
        matchBits[2],
        matchBits[3],
      ]);
      lexer.parser.parseItem(startMS);
      const ignoredAtts = [
        'sid',
        'eid',
        'style',
        'srcloc',
        'link-href',
        'link-title',
        'link-id',
      ];

      for (const [attName, attValue] of Object.entries(atts)) {
        if (!ignoredAtts.includes(attName)) {
          lexer.parser.parseItem(
            constructorForFragment.attribute('attribute', [
              null,
              null,
              attName,
              attValue,
            ])
          );
        }
      }
      lexer.parser.parseItem(
        constructorForFragment.milestone('endMilestoneMarker')
      );
    } else {
      const emptyMS = constructorForFragment.milestone('emptyMilestone', [
        null,
        null,
        atts.marker,
        '',
      ]);
      lexer.parser.parseItem(emptyMS);
    }
    lexer.stackPush(name, atts);
  }

  handleMSClose(lexer) {
    lexer.stackPop();
  }

  handleFigureOpen(lexer, oOrC, name, atts) {
    lexer.parser.parseItem(
      constructorForFragment.tag('startTag', [null, null, '+fig', ''])
    );

    for (const [attName, attValue] of Object.entries(atts)) {
      if (attName === 'marker') {
        continue;
      }

      const scopeAttName = attName === 'file' ? 'src' : attName;
      lexer.parser.parseItem(
        constructorForFragment.attribute('attribute', [
          null,
          null,
          scopeAttName,
          attValue,
        ])
      );
    }
    lexer.stackPush(name, atts);
  }

  handleFigureClose(lexer) {
    const sAtts = lexer.stackPop()[1];
    lexer.parser.parseItem(
      constructorForFragment.tag('endTag', [null, null, `+fig`, ''])
    );
  }

  handleOptBreakOpen(lexer, oOrC, name, atts) {
    lexer.parser.parseItem(
      constructorForFragment.printable('softLineBreak', ['//'])
    );
    lexer.stackPush(name, atts);
  }

  handleOptBreakClose(lexer) {
    lexer.stackPop();
  }
}

export { UsjLexer };
