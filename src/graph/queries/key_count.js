const keyCountSchemaString = `
"""Key/Count tuple"""
type KeyCount {
    """The key"""
    key: String!
    """The number of occurrences"""
    count: Int!
}`;

const keyCountResolvers = {
  key: (root) => root[0],
  count: (root) => root[1],
};

export { keyCountSchemaString, keyCountResolvers };
