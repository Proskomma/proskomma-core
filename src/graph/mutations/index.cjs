const {
  addMutationsSchemaString,
  addMutationsResolvers,
} = require('./add.cjs');

const {
  deleteMutationsSchemaString,
  deleteMutationsResolvers,
} = require('./delete.cjs');

const {
  rehashMutationsSchemaString,
  rehashMutationsResolvers,
} = require('./rehash.cjs');

const {
  tagMutationsSchemaString,
  tagMutationsResolvers,
} = require('./tags.cjs');

const {
  updateMutationsSchemaString,
  updateMutationsResolvers,
} = require('./update.cjs');

const {
  versificationMutationsSchemaString,
  versificationMutationsResolvers,
} = require('./versification.cjs');

const mutationsSchemaString = `
type Mutation {
${addMutationsSchemaString}
${deleteMutationsSchemaString}
${rehashMutationsSchemaString}
${tagMutationsSchemaString}
${updateMutationsSchemaString}
${versificationMutationsSchemaString}
}`;

const mutationsResolvers = {
  ...addMutationsResolvers,
  ...deleteMutationsResolvers,
  ...rehashMutationsResolvers,
  ...tagMutationsResolvers,
  ...updateMutationsResolvers,
  ...versificationMutationsResolvers,
};


module.exports = {
  mutationsSchemaString,
  mutationsResolvers,
};
