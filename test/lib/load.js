const path = require('path');
const fse = require('fs-extra');

const pkSrc = (process.env.PKSRC) || 'dist';

const { Proskomma } = require(`../../${pkSrc}`);

const pkWithDoc = (fp, selectors, options, customTags, emptyBlocks, tags) => {
  if (!options) {
    options = {};
  }

  const content = fse.readFileSync(path.resolve(__dirname, fp));
  let contentType = fp.split('.').pop();

  const pk = new Proskomma();
  const pkDoc = pk.importDocument(
    selectors,
    contentType,
    content,
    options,
    customTags,
    emptyBlocks,
    tags,
  );
  return [pk, pkDoc];
};

const customPkWithDoc = (pkClass, fp, selectors, options) => {
  if (!options) {
    options = {};
  }

  const content = fse.readFileSync(path.resolve(__dirname, fp));
  let contentType = fp.split('.').pop();

  const pk = new pkClass();
  const pkDoc = pk.importDocument(
    selectors,
    contentType,
    content,
    options,
  );
  return [pk, pkDoc];
};

const pkWithDocs = (contentSpecs) => {
  const pk = new Proskomma();

  for (const [fp, selectors] of contentSpecs) {
    const content = fse.readFileSync(path.resolve(__dirname, fp));
    let contentType = fp.split('.').pop();

    pk.importDocument(
      selectors,
      contentType,
      content,
      {},
    );
  }
  return pk;
};

const customPkWithDocs = (pkClass, contentSpecs) => {
  const pk = new pkClass();

  for (const [fp, selectors] of contentSpecs) {
    const content = fse.readFileSync(path.resolve(__dirname, fp));
    let contentType = fp.split('.').pop();

    pk.importDocument(
      selectors,
      contentType,
      content,
      {},
    );
  }
  return pk;
};

const pkWithDocSetDocs = (fps, selectors, options) => {
  if (!options) {
    options = {};
  }

  const fpContent = [];
  fps.forEach(fp => fpContent.push(fse.readFileSync(path.resolve(__dirname, fp))));
  let contentType = fps[0].split('.').pop();

  const pk = new Proskomma();
  const pkDocs = pk.importDocuments(
    selectors,
    contentType,
    fpContent,
    options,
  );
  return [pk, pkDocs];
};

const escapeStringQuotes = str => str.replace(/"/g, '\\"').replace(/'/, '\\\'');

module.exports = {
  pkWithDoc,
  customPkWithDoc,
  pkWithDocs,
  customPkWithDocs,
  pkWithDocSetDocs,
  escapeStringQuotes,
};
