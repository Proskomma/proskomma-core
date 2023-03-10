import UUID from 'pure-uuid';
// import btoa from "btoa";
import base64 from 'base-64';

const generateId = () => base64.encode(new UUID(4)).substring(0, 12);

export { generateId };
