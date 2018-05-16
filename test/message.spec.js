'use strict';

const assert              = require('assert');
const EventEmitter        = require('events');
const { describe, it }    = require('mocha');
const { decoder, encode } = require('../lib/message');

const e = new EventEmitter();
const decode = decoder( e );

describe( 'message', () => {
  it( 'encodes and decodes a message', done => {
    const buf = encode({ cmd: 'request' });
    e.once( 'queue', msg => {
      assert.deepStrictEqual( msg, { cmd: 'request' });
      done();
    });
    decode( buf );
  });

  it( 'fails to decode a bad message', done => {
    const msgBuf = Buffer.from('{ a: 1, b: 2, }');
    const sizeBuf = Buffer.alloc( 4 );
    sizeBuf.writeInt32BE( msgBuf.length );
    const buf = Buffer.concat([ sizeBuf, msgBuf ]);
    e.once( 'error', () => done() );
    decode( buf );
  });
});
