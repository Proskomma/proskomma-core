const keyCountCategorySchemaString = `
"""Key/Count/Category tuple"""
type KeyCountCategory {
    """The key"""
    key: String!
    """The number of occurrences"""
    count: Int!
    """The category"""
    category: String!
}`;

const keyCountCategoryResolvers = {
  key: (root) => root[0],
  count: (root) => root[1],
  category: (root) => root[2],
};

export { keyCountCategorySchemaString, keyCountCategoryResolvers };
