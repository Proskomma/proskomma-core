const UUID = require('pure-uuid');
const btoa = require('btoa');

const generateId = () => btoa(new UUID(4)).substring(0, 12);

module.exports = { generateId };
