'use strict';

/** @module contact */

/**
 * @typedef {Object} Contact
 * @property {string} address
 * @property {number} port
 */

/**
 * contact.encode
 * @param  {(Object|string)} c
 * @return {string}
 */
exports.encode = c => {
  if ( typeof c === 'string' ) {
    return c;
  }
  return `${c.address}:${c.port}`;
};

/**
 * contact.decode
 * @param  {(Object|string)} c
 * @return {Contact}
 */
exports.decode = c => {
  let address, port;
  if ( typeof c === 'string' ) {
    [ address, port ] = c.split(':');
    port = parseInt( port );
  } else {
    address = c.address;
    port = c.port;
  }
  return { address, port };
}

/**
 * contact.equal
 * @param  {(Object|string)} c1
 * @param  {(Object|string)} c2
 * @return {boolean}
 */
exports.equal = ( c1, c2 ) => {
  return exports.encode( c1 ) === exports.encode( c2 );
}
