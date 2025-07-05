const emptyString = '';

/**
@private
*/
class StringScanner {
  /**
  @param {string} string
  */
  constructor(string) {
    /** @type {string[]} */
    this.chars = [ ...string ];

    /** @type {number} */
    this.charCount = this.chars.length;

    /** @type {number} */
    this.charIndex = 0;

    /** @type {number[]} */
    this.charsToBytes = new Array(this.charCount);

    /** @type {boolean} */
    this.multiByteMode = false;

    /** @type {string} */
    this.string = string;

    let { chars, charCount, charsToBytes } = this;

    if (charCount === string.length) {
      // There are no multibyte characters in the input string, so char indexes
      // and byte indexes are the same.
      for (let i = 0; i < charCount; ++i) {
        charsToBytes[i] = i;
      }
    } else {
      // Create a mapping of character indexes to byte indexes. When the string
      // contains multibyte characters, a byte index may not necessarily align
      // with a character index.
      for (let byteIndex = 0, charIndex = 0; charIndex < charCount; ++charIndex) {
        charsToBytes[charIndex] = byteIndex;
        byteIndex += chars[charIndex].length;
      }

      this.multiByteMode = true;
    }
  }

  /**
  Whether the current character index is at the end of the input string.

  @type {boolean}
  */
  get isEnd() {
    return this.charIndex >= this.charCount;
  }

  // -- Protected Methods ------------------------------------------------------

  /**
  Returns the number of characters in the given _string_, which may differ from
  the byte length if the string contains multibyte characters.

  @param {string} string
  @returns {number}
  */
  _charLength(string) {
    let { length } = string;

    if (length < 2 || !this.multiByteMode) {
      return length;
    }

    // We could get the char length with `[ ...string ].length`, but that's
    // actually slower than this approach, which replaces surrogate pairs with
    // single-byte characters.
    return string.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '_').length;
  }

  // -- Public Methods ---------------------------------------------------------

  /**
  Advances the scanner by the given number of characters, stopping if the end of
  the string is reached.

  @param {number} [count]
  */
  advance(count = 1) {
    this.charIndex = Math.min(this.charCount, this.charIndex + count);
  }

  /**
  Consumes and returns the given number of characters if possible, advancing the
  scanner and stopping if the end of the string is reached.

  If no characters could be consumed, an empty string will be returned.

  @param {number} [count]
  @returns {string}
  */
  consume(count = 1) {
    let chars = this.peek(count);
    this.advance(count);
    return chars;
  }

  /**
  Consumes a match for the given sticky regex, advances the scanner, updates the
  `lastIndex` property of the regex, and returns the matching string.

  The regex must have a sticky flag ("y") so that its `lastIndex` prop can be
  used to anchor the match at the current scanner position.

  Returns the consumed string, or an empty string if nothing was consumed.

  @param {RegExp} regex
  @returns {string}
  */
  consumeMatch(regex) {
    if (!regex.sticky) {
      throw new Error('`regex` must have a sticky flag ("y")');
    }

    regex.lastIndex = this.charsToBytes[this.charIndex];

    let result = regex.exec(this.string);

    if (result === null) {
      return emptyString;
    }

    let match = result[0];
    this.advance(this._charLength(match));
    return match;
  }

  /**
  Consumes and returns all characters for which the given function returns a
  truthy value, stopping on the first falsy return value or if the end of the
  input is reached.

  @param {(char: string) => boolean} fn
  @returns {string}
  */
  consumeMatchFn(fn) {
    let startIndex = this.charIndex;

    while (!this.isEnd && fn(this.peek())) {
      this.advance();
    }

    return this.charIndex > startIndex
      ? this.string.slice(this.charsToBytes[startIndex], this.charsToBytes[this.charIndex])
      : emptyString;
  }

  /**
  Consumes the given string if it exists at the current character index, and
  advances the scanner.

  If the given string doesn't exist at the current character index, an empty
  string will be returned and the scanner will not be advanced.

  @param {string} stringToConsume
  @returns {string}
  */
  consumeString(stringToConsume) {
    if (this.consumeStringFast(stringToConsume)) {
      return stringToConsume;
    }

    if (!this.multiByteMode) {
      return emptyString;
    }

    let { length } = stringToConsume;
    let charLengthToMatch = this._charLength(stringToConsume);

    if (charLengthToMatch !== length
        && stringToConsume === this.peek(charLengthToMatch)) {

      this.advance(charLengthToMatch);
      return stringToConsume;
    }

    return emptyString;
  }

  /**
   * Does the same thing as `consumeString()`, but doesn't support consuming
   * multibyte characters. This can be much faster if you only need to match
   * single byte characters.
   *
   * @param {string} stringToConsume
   * @returns {string}
   */
  consumeStringFast(stringToConsume) {
    if (this.peek() === stringToConsume[0]) {
      let { length } = stringToConsume;

      if (length === 1) {
        this.advance();
        return stringToConsume;
      }

      if (this.peek(length) === stringToConsume) {
        this.advance(length);
        return stringToConsume;
      }
    }

    return emptyString;
  }

  /**
  Consumes characters until the given global regex is matched, advancing the
  scanner up to (but not beyond) the beginning of the match and updating the
  `lastIndex` property of the regex.

  The regex must have a global flag ("g") so that its `lastIndex` prop can be
  used to begin the search at the current scanner position.

  Returns the consumed string, or an empty string if nothing was consumed.

  @param {RegExp} regex
  @returns {string}
  */
  consumeUntilMatch(regex) {
    if (!regex.global) {
      throw new Error('`regex` must have a global flag ("g")');
    }

    let byteIndex = this.charsToBytes[this.charIndex];
    regex.lastIndex = byteIndex;

    let match = regex.exec(this.string);

    if (match === null || match.index === byteIndex) {
      return emptyString;
    }

    let result = this.string.slice(byteIndex, match.index);
    this.advance(this._charLength(result));
    return result;
  }

  /**
  Consumes characters until the given string is found, advancing the scanner up
  to (but not beyond) that point.

  Returns the consumed string, or an empty string if nothing was consumed.

  @param {string} searchString
  @returns {string}
  */
  consumeUntilString(searchString) {
    let { charIndex, charsToBytes, string } = this;
    let byteIndex = charsToBytes[charIndex];
    let matchByteIndex = string.indexOf(searchString, byteIndex);

    if (matchByteIndex <= 0) {
      return emptyString;
    }

    let result = string.slice(byteIndex, matchByteIndex);
    this.advance(this._charLength(result));
    return result;
  }

  /**
  Returns the given number of characters starting at the current character
  index, without advancing the scanner and without exceeding the end of the
  input string.

  @param {number} [count]
  @returns {string}
  */
  peek(count = 1) {
    // Inlining this comparison instead of checking `this.isEnd` improves perf
    // slightly since `peek()` is called so frequently.
    if (this.charIndex >= this.charCount) {
      return emptyString;
    }

    if (count === 1) {
      return this.chars[this.charIndex];
    }

    let { charsToBytes, charIndex } = this;
    return this.string.slice(charsToBytes[charIndex], charsToBytes[charIndex + count]);
  }

  /**
  Resets the scanner position to the given character _index_, or to the start of
  the input string if no index is given.

  If _index_ is negative, the scanner position will be moved backward by that
  many characters, stopping if the beginning of the string is reached.

  @param {number} [index]
  */
  reset(index = 0) {
    this.charIndex = index >= 0
      ? Math.min(this.charCount, index)
      : Math.max(0, this.charIndex + index);
  }
}

var StringScanner_1 = StringScanner;

// -- Exported Constants -------------------------------------------------------

/**
Mapping of predefined entity names to their replacement values.

@type {Readonly<{[name: string]: string}>}
@see https://www.w3.org/TR/2008/REC-xml-20081126/#sec-predefined-ent
*/
const predefinedEntities = Object.freeze(Object.assign(Object.create(null), {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  quot: '"'
}));

var predefinedEntities_1 = predefinedEntities;

// -- Exported Functions -------------------------------------------------------

/**
Returns `true` if _char_ is an XML `NameChar`, `false` if it isn't.

@param {string} char
@returns {boolean}
@see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-NameChar
*/
function isNameChar(char) {
  if (isNameStartChar(char)) {
    return true;
  }

  let cp = getCodePoint(char);

  return cp === 0x2D // -
    || cp === 0x2E // .
    || (cp >= 0x30 && cp <= 0x39) // 0-9
    || cp === 0xB7
    || (cp >= 0x300 && cp <= 0x36F)
    || (cp >= 0x203F && cp <= 0x2040);
}

var isNameChar_1 = isNameChar;

/**
Returns `true` if _char_ is an XML `NameStartChar`, `false` if it isn't.

@param {string} char
@returns {boolean}
@see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-NameStartChar
*/
function isNameStartChar(char) {
  let cp = getCodePoint(char);

  return cp === 0x3A // :
    || cp === 0x5F // _
    || (cp >= 0x41 && cp <= 0x5A) // A-Z
    || (cp >= 0x61 && cp <= 0x7A) // a-z
    || (cp >= 0xC0 && cp <= 0xD6)
    || (cp >= 0xD8 && cp <= 0xF6)
    || (cp >= 0xF8 && cp <= 0x2FF)
    || (cp >= 0x370 && cp <= 0x37D)
    || (cp >= 0x37F && cp <= 0x1FFF)
    || (cp >= 0x200C && cp <= 0x200D)
    || (cp >= 0x2070 && cp <= 0x218F)
    || (cp >= 0x2C00 && cp <= 0x2FEF)
    || (cp >= 0x3001 && cp <= 0xD7FF)
    || (cp >= 0xF900 && cp <= 0xFDCF)
    || (cp >= 0xFDF0 && cp <= 0xFFFD)
    || (cp >= 0x10000 && cp <= 0xEFFFF);
}

var isNameStartChar_1 = isNameStartChar;

/**
Returns `true` if _char_ is not a valid XML `Char`, `false` otherwise.

@param {string} char
@returns {boolean}
@see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-Char
*/
function isNotXmlChar(char) {
  return !isXmlChar(char);
}

var isNotXmlChar_1 = isNotXmlChar;

/**
Returns `true` if _char_ is a valid reference character (which may appear
between `&` and `;` in a reference), `false` otherwise.

@param {string} char
@returns {boolean}
@see https://www.w3.org/TR/2008/REC-xml-20081126/#sec-references
*/
function isReferenceChar(char) {
  return char === '#' || isNameChar(char);
}

var isReferenceChar_1 = isReferenceChar;

/**
Returns `true` if _char_ is an XML whitespace character, `false` otherwise.

@param {string} char
@returns {boolean}
@see https://www.w3.org/TR/2008/REC-xml-20081126/#white
*/
function isWhitespace(char) {
  let cp = getCodePoint(char);

  return cp === 0x20
    || cp === 0x9
    || cp === 0xA
    || cp === 0xD;
}

var isWhitespace_1 = isWhitespace;

/**
Returns `true` if _char_ is a valid XML `Char`, `false` otherwise.

@param {string} char
@returns {boolean}
@see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-Char
*/
function isXmlChar(char) {
  let cp = getCodePoint(char);

  return cp === 0x9
    || cp === 0xA
    || cp === 0xD
    || (cp >= 0x20 && cp <= 0xD7FF)
    || (cp >= 0xE000 && cp <= 0xFFFD)
    || (cp >= 0x10000 && cp <= 0x10FFFF);
}

var isXmlChar_1 = isXmlChar;

// -- Private Functions --------------------------------------------------------

/**
Returns the Unicode code point value of the given character, or `-1` if _char_
is empty.

@param {string} char
@returns {number}
*/
function getCodePoint(char) {
  return char.codePointAt(0) || -1;
}

var syntax = {
	predefinedEntities: predefinedEntities_1,
	isNameChar: isNameChar_1,
	isNameStartChar: isNameStartChar_1,
	isNotXmlChar: isNotXmlChar_1,
	isReferenceChar: isReferenceChar_1,
	isWhitespace: isWhitespace_1,
	isXmlChar: isXmlChar_1
};

/**
Base interface for a node in an XML document.

@public
*/
class XmlNode {
  constructor() {
    /**
    Parent node of this node, or `null` if this node has no parent.

    @type {XmlDocument|XmlElement|null}
    @public
    */
    this.parent = null;
  }

  /**
  Document that contains this node, or `null` if this node is not associated
  with a document.

  @type {XmlDocument?}
  @public
  */
  get document() {
    return this.parent
      ? this.parent.document
      : null;
  }

  /**
  Whether this node is the root node of the document.

  @returns {boolean}
  @public
  */
  get isRootNode() {
    return this.parent
      ? this.parent === this.document
      : false;
  }

  /**
  Whether whitespace should be preserved in the content of this element and
  its children.

  This is influenced by the value of the special `xml:space` attribute, and
  will be `true` for any node whose `xml:space` attribute is set to
  "preserve". If a node has no such attribute, it will inherit the value of
  the nearest ancestor that does (if any).

  @type {boolean}
  @see https://www.w3.org/TR/2008/REC-xml-20081126/#sec-white-space
  @public
  */
  get preserveWhitespace() {
    return Boolean(this.parent && this.parent.preserveWhitespace);
  }

  /**
  Type of this node.

  The value of this property is a string that matches one of the static `TYPE_*`
  properties on the `XmlNode` class (e.g. `TYPE_ELEMENT`, `TYPE_TEXT`, etc.).

  The `XmlNode` class itself is a base class and doesn't have its own type name.

  @type {string}
  @public
  */
  get type() {
    return '';
  }

  /**
  Returns a JSON-serializable object representing this node, minus properties
  that could result in circular references.

  @returns {{[key: string]: any}}
  @public
  */
  toJSON() {
    /** @type {{[key: string]: any}} */
    let json = {
      type: this.type
    };

    if (this.isRootNode) {
      json.isRootNode = true;
    }

    if (this.preserveWhitespace) {
      json.preserveWhitespace = true;
    }

    return json;
  }
}

/**
Type value for an `XmlCdata` node.

@type {string}
@public
*/
XmlNode.TYPE_CDATA = 'cdata';

/**
Type value for an `XmlComment` node.

@type {string}
@public
*/
XmlNode.TYPE_COMMENT = 'comment';

/**
Type value for an `XmlDocument` node.

@type {string}
@public
*/
XmlNode.TYPE_DOCUMENT = 'document';

/**
Type value for an `XmlElement` node.

@type {string}
@public
*/
XmlNode.TYPE_ELEMENT = 'element';

/**
Type value for an `XmlProcessingInstruction` node.

@type {string}
@public
*/
XmlNode.TYPE_PROCESSING_INSTRUCTION = 'pi';

/**
Type value for an `XmlText` node.

@type {string}
@public
*/
XmlNode.TYPE_TEXT = 'text';

var XmlNode_1 = XmlNode;

/**
Text content within an XML document.

@public
*/
class XmlText extends XmlNode_1 {
  /**
  @param {string} [text]
  */
  constructor(text = '') {
    super();

    /**
    Text content of this node.

    @type {string}
    @public
    */
    this.text = text;
  }

  get type() {
    return XmlNode_1.TYPE_TEXT;
  }

  toJSON() {
    return Object.assign(XmlNode_1.prototype.toJSON.call(this), {
      text: this.text
    });
  }
}

var XmlText_1 = XmlText;

/**
A CDATA section within an XML document.

@public
*/
class XmlCdata extends XmlText_1 {
  get type() {
    return XmlNode_1.TYPE_CDATA;
  }
}

var XmlCdata_1 = XmlCdata;

/**
A comment within an XML document.

@public
*/
class XmlComment extends XmlNode_1 {
  /**
  @param {string} [content]
  */
  constructor(content = '') {
    super();

    /**
    Content of this comment.

    @type {string}
    @public
    */
    this.content = content;
  }

  get type() {
    return XmlNode_1.TYPE_COMMENT;
  }

  toJSON() {
    return Object.assign(XmlNode_1.prototype.toJSON.call(this), {
      content: this.content
    });
  }
}

var XmlComment_1 = XmlComment;

/**
Element in an XML document.

@public
*/
class XmlElement extends XmlNode_1 {
  /**
  @param {string} name
  @param {{[attrName: string]: string}} [attributes]
  @param {Array<XmlCdata|XmlComment|XmlElement|XmlProcessingInstruction|XmlText>} [children]
  */
  constructor(name, attributes = Object.create(null), children = []) {
    super();

    /**
    Name of this element.

    @type {string}
    @public
    */
    this.name = name;

    /**
    Attributes on this element.

    @type {{[attrName: string]: string}}
    @public
    */
    this.attributes = attributes;

    /**
    Child nodes of this element.

    @type {Array<XmlCdata|XmlComment|XmlElement|XmlProcessingInstruction|XmlText>}
    @public
    */
    this.children = children;
  }

  /**
  Whether this node is empty (meaning it has no children).

  @type {boolean}
  @public
  */
  get isEmpty() {
    return this.children.length === 0;
  }

  /** @type {boolean} */
  get preserveWhitespace() {
    /** @type {XmlNode?} */
    let node = this;

    while (node instanceof XmlElement) {
      if ('xml:space' in node.attributes) {
        return node.attributes['xml:space'] === 'preserve';
      }

      node = node.parent;
    }

    return false;
  }

  /**
  Text content of this element and all its descendants.

  @type {string}
  @public
  */
  get text() {
    return this.children
      .map(child => 'text' in child ? child.text : '')
      .join('');
  }

  get type() {
    return XmlNode_1.TYPE_ELEMENT;
  }

  /** @returns {{[key: string]: any}} */
  toJSON() {
    return Object.assign(XmlNode_1.prototype.toJSON.call(this), {
      name: this.name,
      attributes: this.attributes,
      children: this.children.map(child => child.toJSON()),
    });
  }
}

var XmlElement_1 = XmlElement;

/**
Represents an XML document. All elements within the document are descendants of
this node.

@public
*/
class XmlDocument extends XmlNode_1 {
  /**
  @param {Array<XmlComment|XmlElement|XmlProcessingInstruction>} [children]
  */
  constructor(children = []) {
    super();

    /**
    Child nodes of this document.

    @type {Array<XmlComment|XmlElement|XmlProcessingInstruction>}
    @public
    */
    this.children = children;
  }

  get document() {
    return this;
  }

  /**
  Root element of this document, or `null` if this document is empty.

  @type {XmlElement?}
  @public
  */
  get root() {
    // @ts-ignore
    return this.children.find((child) => child instanceof XmlElement_1) || null;
  }

  /**
  Text content of this document and all its descendants.

  @type {string}
  @public
  */
  get text() {
    return this.children
      .map(child => 'text' in child ? child.text : '')
      .join('');
  }

  get type() {
    return XmlNode_1.TYPE_DOCUMENT;
  }

  toJSON() {
    return Object.assign(XmlNode_1.prototype.toJSON.call(this), {
      children: this.children.map(child => child.toJSON()),
    });
  }
}

var XmlDocument_1 = XmlDocument;

/**
A processing instruction within an XML document.

@public
*/
class XmlProcessingInstruction extends XmlNode_1 {
  /**
  @param {string} name
  @param {string} [content]
  */
  constructor(name, content = '') {
    super();

    /**
    Name of this processing instruction. Also sometimes referred to as the
    processing instruction "target".

    @type {string}
    @public
    */
    this.name = name;

    /**
    Content of this processing instruction.

    @type {string}
    @public
    */
    this.content = content;
  }

  get type() {
    return XmlNode_1.TYPE_PROCESSING_INSTRUCTION;
  }

  toJSON() {
    return Object.assign(XmlNode_1.prototype.toJSON.call(this), {
      name: this.name,
      content: this.content
    });
  }
}

var XmlProcessingInstruction_1 = XmlProcessingInstruction;

const emptyString$1 = '';

/**
Parses an XML string into an `XmlDocument`.

@private
*/
class Parser {
  /**
  @param {string} xml
    XML string to parse.

  @param {object} [options]
    Parsing options.

    @param {boolean} [options.ignoreUndefinedEntities=false]
    @param {boolean} [options.preserveCdata=false]
    @param {boolean} [options.preserveComments=false]
    @param {(entity: string) => string?} [options.resolveUndefinedEntity]
    @param {boolean} [options.sortAttributes=false]
  */
  constructor(xml, options = {}) {
    /** @type {XmlDocument} */
    this.document = new XmlDocument_1();

    /** @type {XmlDocument|XmlElement} */
    this.currentNode = this.document;

    this.options = options;
    this.scanner = new StringScanner_1(normalizeXmlString(xml));

    this.consumeProlog();

    if (!this.consumeElement()) {
      this.error('Root element is missing or invalid');
    }

    while (this.consumeMisc()) {} // eslint-disable-line no-empty

    if (!this.scanner.isEnd) {
      this.error('Extra content at the end of the document');
    }
  }

  /**
  Adds the given `XmlNode` as a child of `this.currentNode`.

  @param {XmlNode} node
  */
  addNode(node) {
    node.parent = this.currentNode;

    // @ts-ignore
    this.currentNode.children.push(node);
  }

  /**
  Adds the given _text_ to the document, either by appending it to a preceding
  `XmlText` node (if possible) or by creating a new `XmlText` node.

  @param {string} text
  */
  addText(text) {
    let { children } = this.currentNode;

    if (children.length > 0) {
      let prevNode = children[children.length - 1];

      if (prevNode instanceof XmlText_1) {
        // The previous node is a text node, so we can append to it and avoid
        // creating another node.
        prevNode.text += text;
        return;
      }
    }

    this.addNode(new XmlText_1(text));
  }

  /**
  Consumes an `AttValue` (attribute value) if possible.

  @returns {string|false}
    Contents of the `AttValue` minus quotes, or `false` if nothing was consumed.
    An empty string indicates that an `AttValue` was consumed but was empty.

  @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-AttValue
  */
  consumeAttributeValue() {
    let { scanner } = this;
    let quote = scanner.peek();

    if (quote !== '"' && quote !== "'") {
      return false;
    }

    scanner.advance();

    let chars;
    let isClosed = false;
    let value = emptyString$1;
    let regex = quote === '"'
      ? /[^"&<]+/y
      : /[^'&<]+/y;

    matchLoop: while (!scanner.isEnd) {
      chars = scanner.consumeMatch(regex);

      if (chars) {
        this.validateChars(chars);
        value += chars.replace(/[\t\r\n]/g, ' ');
      }

      let nextChar = scanner.peek();

      switch (nextChar) {
        case quote:
          isClosed = true;
          break matchLoop;

        case '&':
          value += this.consumeReference();
          continue;

        case '<':
          this.error('Unescaped `<` is not allowed in an attribute value'); /* istanbul ignore next */
          break;

        case emptyString$1:
          this.error('Unclosed attribute'); /* istanbul ignore next */
          break;

      }
    }

    if (!isClosed) {
      this.error('Unclosed attribute');
    }

    scanner.advance();
    return value;
  }

  /**
  Consumes a CDATA section if possible.

  @returns {boolean}
    Whether a CDATA section was consumed.

  @see https://www.w3.org/TR/2008/REC-xml-20081126/#sec-cdata-sect
  */
  consumeCdataSection() {
    let { scanner } = this;

    if (!scanner.consumeStringFast('<![CDATA[')) {
      return false;
    }

    let text = scanner.consumeUntilString(']]>');
    this.validateChars(text);

    if (!scanner.consumeStringFast(']]>')) {
      this.error('Unclosed CDATA section');
    }

    if (this.options.preserveCdata) {
      this.addNode(new XmlCdata_1(text));
    } else {
      this.addText(text);
    }

    return true;
  }

  /**
  Consumes character data if possible.

  @returns {boolean}
    Whether character data was consumed.

  @see https://www.w3.org/TR/2008/REC-xml-20081126/#dt-chardata
  */
  consumeCharData() {
    let { scanner } = this;
    let charData = scanner.consumeUntilMatch(/<|&|]]>/g);

    if (!charData) {
      return false;
    }

    this.validateChars(charData);

    if (scanner.peek() === ']' && scanner.peek(3) === ']]>') {
      this.error('Element content may not contain the CDATA section close delimiter `]]>`');
    }

    this.addText(charData);
    return true;
  }

  /**
  Consumes a comment if possible.

  @returns {boolean}
    Whether a comment was consumed.

  @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-Comment
  */
  consumeComment() {
    let { scanner } = this;

    if (!scanner.consumeStringFast('<!--')) {
      return false;
    }

    let content = scanner.consumeUntilString('--');
    this.validateChars(content);

    if (!scanner.consumeStringFast('-->')) {
      if (scanner.peek(2) === '--') {
        this.error("The string `--` isn't allowed inside a comment");
      } else {
        this.error('Unclosed comment');
      }
    }

    if (this.options.preserveComments) {
      this.addNode(new XmlComment_1(content.trim()));
    }

    return true;
  }

  /**
  Consumes a reference in a content context if possible.

  This differs from `consumeReference()` in that a consumed reference will be
  added to the document as a text node instead of returned.

  @returns {boolean}
    Whether a reference was consumed.

  @see https://www.w3.org/TR/2008/REC-xml-20081126/#entproc
  */
  consumeContentReference() {
    let ref = this.consumeReference();

    if (ref) {
      this.addText(ref);
      return true;
    }

    return false;
  }

  /**
  Consumes a doctype declaration if possible.

  This is a loose implementation since doctype declarations are currently
  discarded without further parsing.

  @returns {boolean}
    Whether a doctype declaration was consumed.

  @see https://www.w3.org/TR/2008/REC-xml-20081126/#dtd
  */
  consumeDoctypeDeclaration() {
    let { scanner } = this;

    if (!scanner.consumeStringFast('<!DOCTYPE')
        || !this.consumeWhitespace()) {

      return false;
    }

    scanner.consumeMatch(/[^[>]+/y);

    if (scanner.consumeMatch(/\[[\s\S]+?\][\x20\t\r\n]*>/y)) {
      return true;
    }

    if (!scanner.consumeStringFast('>')) {
      this.error('Unclosed doctype declaration');
    }

    return true;
  }

  /**
  Consumes an element if possible.

  @returns {boolean}
    Whether an element was consumed.

  @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-element
  */
  consumeElement() {
    let { scanner } = this;
    let mark = scanner.charIndex;

    if (scanner.peek() !== '<') {
      return false;
    }

    scanner.advance();
    let name = this.consumeName();

    if (!name) {
      scanner.reset(mark);
      return false;
    }

    let attributes = Object.create(null);

    while (this.consumeWhitespace()) {
      let attrName = this.consumeName();

      if (!attrName) {
        continue;
      }

      let attrValue = this.consumeEqual()
        && this.consumeAttributeValue();

      if (attrValue === false) {
        this.error('Attribute value expected');
      }

      if (attrName in attributes) {
        this.error(`Duplicate attribute: ${attrName}`);
      }

      if (attrName === 'xml:space'
          && attrValue !== 'default'
          && attrValue !== 'preserve') {

        this.error('Value of the `xml:space` attribute must be "default" or "preserve"');
      }

      attributes[attrName] = attrValue;
    }

    if (this.options.sortAttributes) {
      let attrNames = Object.keys(attributes).sort();
      let sortedAttributes = Object.create(null);

      for (let i = 0; i < attrNames.length; ++i) {
        let attrName = attrNames[i];
        sortedAttributes[attrName] = attributes[attrName];
      }

      attributes = sortedAttributes;
    }

    let isEmpty = Boolean(scanner.consumeStringFast('/>'));
    let element = new XmlElement_1(name, attributes);

    element.parent = this.currentNode;

    if (!isEmpty) {
      if (!scanner.consumeStringFast('>')) {
        this.error(`Unclosed start tag for element \`${name}\``);
      }

      this.currentNode = element;
      this.consumeCharData();

      while (
        this.consumeElement()
          || this.consumeContentReference()
          || this.consumeCdataSection()
          || this.consumeProcessingInstruction()
          || this.consumeComment()
      ) {
        this.consumeCharData();
      }

      let endTagMark = scanner.charIndex;
      let endTagName;

      if (!scanner.consumeStringFast('</')
          || !(endTagName = this.consumeName())
          || endTagName !== name) {

        scanner.reset(endTagMark);
        this.error(`Missing end tag for element ${name}`);
      }

      this.consumeWhitespace();

      if (!scanner.consumeStringFast('>')) {
        this.error(`Unclosed end tag for element ${name}`);
      }

      this.currentNode = element.parent;
    }

    this.addNode(element);
    return true;
  }

  /**
  Consumes an `Eq` production if possible.

  @returns {boolean}
    Whether an `Eq` production was consumed.

  @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-Eq
  */
  consumeEqual() {
    this.consumeWhitespace();

    if (this.scanner.consumeStringFast('=')) {
      this.consumeWhitespace();
      return true;
    }

    return false;
  }

  /**
  Consumes `Misc` content if possible.

  @returns {boolean}
    Whether anything was consumed.

  @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-Misc
  */
  consumeMisc() {
    return this.consumeComment()
      || this.consumeProcessingInstruction()
      || this.consumeWhitespace();
  }

  /**
  Consumes one or more `Name` characters if possible.

  @returns {string}
    `Name` characters, or an empty string if none were consumed.

  @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-Name
  */
  consumeName() {
    return syntax.isNameStartChar(this.scanner.peek())
      ? this.scanner.consumeMatchFn(syntax.isNameChar)
      : emptyString$1;
  }

  /**
  Consumes a processing instruction if possible.

  @returns {boolean}
    Whether a processing instruction was consumed.

  @see https://www.w3.org/TR/2008/REC-xml-20081126/#sec-pi
  */
  consumeProcessingInstruction() {
    let { scanner } = this;
    let mark = scanner.charIndex;

    if (!scanner.consumeStringFast('<?')) {
      return false;
    }

    let name = this.consumeName();

    if (name) {
      if (name.toLowerCase() === 'xml') {
        scanner.reset(mark);
        this.error("XML declaration isn't allowed here");
      }
    } else {
      this.error('Invalid processing instruction');
    }

    if (!this.consumeWhitespace()) {
      if (scanner.consumeStringFast('?>')) {
        this.addNode(new XmlProcessingInstruction_1(name));
        return true;
      }

      this.error('Whitespace is required after a processing instruction name');
    }

    let content = scanner.consumeUntilString('?>');
    this.validateChars(content);

    if (!scanner.consumeStringFast('?>')) {
      this.error('Unterminated processing instruction');
    }

    this.addNode(new XmlProcessingInstruction_1(name, content));
    return true;
  }

  /**
  Consumes a prolog if possible.

  @returns {boolean}
    Whether a prolog was consumed.

  @see https://www.w3.org/TR/2008/REC-xml-20081126/#sec-prolog-dtd
  */
  consumeProlog() {
    let { scanner } = this;
    let mark = scanner.charIndex;

    this.consumeXmlDeclaration();

    while (this.consumeMisc()) {} // eslint-disable-line no-empty

    if (this.consumeDoctypeDeclaration()) {
      while (this.consumeMisc()) {} // eslint-disable-line no-empty
    }

    return mark < scanner.charIndex;
  }

  /**
  Consumes a reference if possible.

  This differs from `consumeContentReference()` in that a consumed reference
  will be returned rather than added to the document.

  @returns {string|false}
    Parsed reference value, or `false` if nothing was consumed (to distinguish
    from a reference that resolves to an empty string).

  @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-Reference
  */
  consumeReference() {
    let { scanner } = this;

    if (scanner.peek() !== '&') {
      return false;
    }

    scanner.advance();

    let ref = scanner.consumeMatchFn(syntax.isReferenceChar);

    if (scanner.consume() !== ';') {
      this.error('Unterminated reference (a reference must end with `;`)');
    }

    let parsedValue;

    if (ref[0] === '#') {
      // This is a character reference.
      let codePoint = ref[1] === 'x'
        ? parseInt(ref.slice(2), 16) // Hex codepoint.
        : parseInt(ref.slice(1), 10); // Decimal codepoint.

      if (isNaN(codePoint)) {
        this.error('Invalid character reference');
      }

      parsedValue = String.fromCodePoint(codePoint);

      if (!syntax.isXmlChar(parsedValue)) {
        this.error('Character reference resolves to an invalid character');
      }
    } else {
      // This is an entity reference.
      parsedValue = syntax.predefinedEntities[ref];

      if (parsedValue === undefined) {
        let {
          ignoreUndefinedEntities,
          resolveUndefinedEntity
        } = this.options;

        let wrappedRef = `&${ref};`; // for backcompat with <= 2.x

        if (resolveUndefinedEntity) {
          let resolvedValue = resolveUndefinedEntity(wrappedRef);

          if (resolvedValue !== null && resolvedValue !== undefined) {
            let type = typeof resolvedValue;

            if (type !== 'string') {
              throw new TypeError(`\`resolveUndefinedEntity()\` must return a string, \`null\`, or \`undefined\`, but returned a value of type ${type}`);
            }

            return resolvedValue;
          }
        }

        if (ignoreUndefinedEntities) {
          return wrappedRef;
        }

        scanner.reset(-wrappedRef.length);
        this.error(`Named entity isn't defined: ${wrappedRef}`);
      }
    }

    return parsedValue;
  }

  /**
  Consumes a `SystemLiteral` if possible.

  A `SystemLiteral` is similar to an attribute value, but allows the characters
  `<` and `&` and doesn't replace references.

  @returns {string|false}
    Value of the `SystemLiteral` minus quotes, or `false` if nothing was
    consumed. An empty string indicates that a `SystemLiteral` was consumed but
    was empty.

  @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-SystemLiteral
  */
  consumeSystemLiteral() {
    let { scanner } = this;
    let quote = scanner.consumeStringFast('"') || scanner.consumeStringFast("'");

    if (!quote) {
      return false;
    }

    let value = scanner.consumeUntilString(quote);
    this.validateChars(value);

    if (!scanner.consumeStringFast(quote)) {
      this.error('Missing end quote');
    }

    return value;
  }

  /**
  Consumes one or more whitespace characters if possible.

  @returns {boolean}
    Whether any whitespace characters were consumed.

  @see https://www.w3.org/TR/2008/REC-xml-20081126/#white
  */
  consumeWhitespace() {
    return Boolean(this.scanner.consumeMatchFn(syntax.isWhitespace));
  }

  /**
  Consumes an XML declaration if possible.

  @returns {boolean}
    Whether an XML declaration was consumed.

  @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-XMLDecl
  */
  consumeXmlDeclaration() {
    let { scanner } = this;

    if (!scanner.consumeStringFast('<?xml')) {
      return false;
    }

    if (!this.consumeWhitespace()) {
      this.error('Invalid XML declaration');
    }

    let version = Boolean(scanner.consumeStringFast('version'))
      && this.consumeEqual()
      && this.consumeSystemLiteral();

    if (version === false) {
      this.error('XML version is missing or invalid');
    } else if (!/^1\.[0-9]+$/.test(version)) {
      this.error('Invalid character in version number');
    }

    if (this.consumeWhitespace()) {
      let encoding = Boolean(scanner.consumeStringFast('encoding'))
        && this.consumeEqual()
        && this.consumeSystemLiteral();

      if (encoding) {
        this.consumeWhitespace();
      }

      let standalone = Boolean(scanner.consumeStringFast('standalone'))
        && this.consumeEqual()
        && this.consumeSystemLiteral();

      if (standalone) {
        if (standalone !== 'yes' && standalone !== 'no') {
          this.error('Only "yes" and "no" are permitted as values of `standalone`');
        }

        this.consumeWhitespace();
      }
    }

    if (!scanner.consumeStringFast('?>')) {
      this.error('Invalid or unclosed XML declaration');
    }

    return true;
  }

  /**
  Throws an error at the current scanner position.

  @param {string} message
  */
  error(message) {
    let { charIndex, string: xml } = this.scanner;
    let column = 1;
    let excerpt = '';
    let line = 1;

    // Find the line and column where the error occurred.
    for (let i = 0; i < charIndex; ++i) {
      let char = xml[i];

      if (char === '\n') {
        column = 1;
        excerpt = '';
        line += 1;
      } else {
        column += 1;
        excerpt += char;
      }
    }

    let eol = xml.indexOf('\n', charIndex);

    excerpt += eol === -1
      ? xml.slice(charIndex)
      : xml.slice(charIndex, eol);

    let excerptStart = 0;

    // Keep the excerpt below 50 chars, but always keep the error position in
    // view.
    if (excerpt.length > 50) {
      if (column < 40) {
        excerpt = excerpt.slice(0, 50);
      } else {
        excerptStart = column - 20;
        excerpt = excerpt.slice(excerptStart, column + 30);
      }
    }

    let err = new Error(
      `${message} (line ${line}, column ${column})\n`
        + `  ${excerpt}\n`
        + ' '.repeat(column - excerptStart + 1) + '^\n'
    );

    Object.assign(err, {
      column,
      excerpt,
      line,
      pos: charIndex
    });

    throw err;
  }

  /**
  Throws an invalid character error if any character in the given _string_ isn't
  a valid XML character.

  @param {string} string
  */
  validateChars(string) {
    let charIndex = 0;

    for (let char of string) {
      if (syntax.isNotXmlChar(char)) {
        this.scanner.reset(-([ ...string ].length - charIndex));
        this.error('Invalid character');
      }

      charIndex += 1;
    }
  }
}

var Parser_1 = Parser;

// -- Private Functions --------------------------------------------------------

/**
Normalizes the given XML string by stripping a byte order mark (if present) and
replacing CRLF sequences and lone CR characters with LF characters.

@param {string} xml
@returns {string}
*/
function normalizeXmlString(xml) {
  if (xml[0] === '\uFEFF') {
    xml = xml.slice(1);
  }

  return xml.replace(/\r\n?/g, '\n');
}

export { Parser_1 as P, XmlCdata_1 as X, XmlComment_1 as a, XmlDocument_1 as b, XmlElement_1 as c, XmlNode_1 as d, XmlProcessingInstruction_1 as e, XmlText_1 as f };
