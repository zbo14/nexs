'use strict';

/** @module contact */

/**
 * @global
 * @typedef  {Object} Contact
 * @property {string} host
 * @property {number} port
 */

/**
 * @global
 * @typedef {(Contact|Object|string)} Info
 */

/**
 * fromObject
 * @param  {Object}   obj
 * @param  {string}   obj.host
 * @param  {number}   obj.port
 * @return {Contact}
 */
const fromObject = obj => ({
  host: obj.host,
  port: obj.port
});

/**
 * fromString
 * @param  {string} str
 * @return {Contact}
 */
const fromString = str => {
  const [ host, port ] = str.split(':');
  return { host, port: parseInt( port ) };
};

/**
 * get
 * @param  {Info[]}           arr
 * @param  {Info}             info
 * @return {(Info|undefined)}
 */
exports.get = ( arr, info ) => {
  return arr.find( elem => exports.equal( elem, info ) );
};

/**
 * getOthers
 * @param  {Info[]} arr
 * @param  {Info}   info
 * @return {Info[]}
 */
exports.getOthers = ( arr, info ) => {
  return arr.filter( elem => !exports.equal( elem, info ) );
};

/**
 * new
 * @param  {Info}    info
 * @return {Contact}
 */
exports.new = info => {
  if ( typeof info === 'string' ) {
    return fromString( info );
  }
  return fromObject( info );
};

/**
 * equal
 * @param  {Info}     info1
 * @param  {Info}     info2
 * @return {boolean}
 */
exports.equal = ( info1, info2 ) => {
  const contact1 = exports.new( info1 );
  const contact2 = exports.new( info2 );
  return contact1.host === contact2.host && contact1.port === contact2.port;
};
