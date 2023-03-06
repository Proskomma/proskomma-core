const UUID = require('pure-uuid');
// const btoa = require('btoa');
const base64 = require('base-64');

const generateId = () => base64.encode(new UUID(4)).substring(0, 12);

module.exports = { generateId };
