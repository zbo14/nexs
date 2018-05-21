'use strict';

/** @module message */

/**
 * @global
 * @typedef  {Object}   Message
 * @property {string}   cmd - the message command.
 * @property {Object}   data - the message data.
 * @property {number}   [resends]
 * @property {Update[]} [updates]
 */

/**
 * encode
 * @param  {Message} msg
 * @return {Buffer}
 */
exports.encode = msg => {
  const msgBuf = Buffer.from( JSON.stringify( msg ) );
  const sizeBuf = Buffer.alloc( 4 );
  sizeBuf.writeInt32BE( msgBuf.length );
  return Buffer.concat([ sizeBuf, msgBuf ]);
};

/**
 * decoder
 * @param  {(EventEmitter|Object)}   e
 * @return {Function}
 */
exports.decoder = e => {
  const data = [];
  let length = null;
  return chunk => {
    data.push( ...chunk );
    if ( length === null && data.length >= 4 ) {
      length = Buffer.from( data.splice( 0, 4 ) ).readInt32BE();
    }
    if ( length !== null && data.length >= length ) {
      try {
        const buf = Buffer.from( data.splice( 0, length ) );
        const msg = JSON.parse( buf.toString() );
        length = null;
        e.emit( 'message', msg );
      } catch ( err ) {
        e.emit( 'error', err );
      }
    }
  };
};
