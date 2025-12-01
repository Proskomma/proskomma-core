const buildPreEnum = (docSet, succinct) => {
  const ret = new Map();
  let pos = 0;
  let enumCount = 0;

  while (pos < succinct.length) {
    ret.set(succinct.countedString(pos), {
      enum: enumCount++,
      frequency: 0,
    });
    pos += succinct.byte(pos) + 1;
  }

  return ret;
};

const recordPreEnum = (docSet, category, value) => {
  if (!(category in docSet.preEnums)) {
    throw new Error(
      `Unknown category ${category} in recordPreEnum. Maybe call buildPreEnums()?`
    );
  }

  if (value.length > 255) {
    console.log('Value length of', value.length, 'in recordPreEnum');
  }

  if (!docSet.preEnums[category].has(value)) {
    docSet.preEnums[category].set(value, {
      enum: docSet.preEnums[category].size,
      frequency: 1,
    });
  } else {
    docSet.preEnums[category].get(value).frequency++;
  }
};

const stringToUtf8ByteArray = (s) => {
  const encoder = new TextEncoder();
  return Array.from(encoder.encode(s));
};

const buildEnum = (docSet, category, preEnumOb) => {
  const sortedPreEnums = new Map([...preEnumOb.entries()]);

  for (const enumText of sortedPreEnums.keys()) {
    // Truncate string by UTF-8 byte length (max 255 bytes), not character length
    // This is necessary for multi-byte scripts like Khmer/Myanmar to work correctly
    let truncatedText = enumText;
    const utf8Bytes = stringToUtf8ByteArray(enumText);
    if (utf8Bytes.length > 255) {
      console.log(
        'enum text for',
        category,
        'has byte length',
        utf8Bytes.length,
        'in buildEnum - truncating to 255 bytes'
      );
      // Find the maximum number of characters that fit in 255 UTF-8 bytes
      let byteCount = 0;
      let charCount = 0;
      for (const char of enumText) {
        const charBytes = stringToUtf8ByteArray(char).length;
        if (byteCount + charBytes > 255) {
          break;
        }
        byteCount += charBytes;
        charCount++;
      }
      truncatedText = enumText.substring(0, charCount);
    }
    docSet.enums[category].pushCountedString(truncatedText);
  }
  docSet.enums[category].trim();
};

const enumForCategoryValue = (docSet, category, value, addUnknown) => {
  if (!addUnknown) {
    addUnknown = false;
  }

  if (!(category in docSet.preEnums)) {
    throw new Error(
      `Unknown category ${category} in preEnums. Maybe call buildPreEnums()?`
    );
  }

  if (docSet.preEnums[category].has(value)) {
    return docSet.preEnums[category].get(value).enum;
  } else if (addUnknown) {
    docSet.preEnums[category].set(value, {
      enum: docSet.preEnums[category].size,
      frequency: 1,
    });
    // Truncate value to 255 UTF-8 bytes to prevent ByteArray overflow
    let truncatedValue = value;
    const utf8Bytes = stringToUtf8ByteArray(value);
    if (utf8Bytes.length > 255) {
      let byteCount = 0;
      let charCount = 0;
      for (const char of value) {
        const charBytes = stringToUtf8ByteArray(char).length;
        if (byteCount + charBytes > 255) {
          break;
        }
        byteCount += charBytes;
        charCount++;
      }
      truncatedValue = value.substring(0, charCount);
    }
    docSet.enums[category].pushCountedString(truncatedValue);
    docSet.buildEnumIndex(category);
    return docSet.preEnums[category].get(value).enum;
  } else {
    throw new Error(
      `Unknown value '${value}' for category ${category} in enumForCategoryValue. Maybe call buildPreEnums()?`
    );
  }
};

export { buildPreEnum, recordPreEnum, buildEnum, enumForCategoryValue };
