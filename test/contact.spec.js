'use strict';

const assert           = require('assert');
const { describe, it } = require('mocha');
const contact          = require('../lib/contact');

const str = '127.0.0.1:1234';
const obj = { id: 0, address: '127.0.0.1', port: 1234 };

describe( 'contact', () => {
  it( 'decodes contact from string', () => {
    const result = contact.decode( str );
    assert.deepStrictEqual( result, { address: '127.0.0.1', port: 1234 } );
  });

  it( 'encodes contact from object', () => {
    const result = contact.encode( obj );
    assert.deepStrictEqual( result, str );
  });

  it( 'checks same contact', () => {
    assert( contact.equal( str, obj ) );
  });
});
