'use strict';

const assert           = require('assert');
const { describe, it } = require('mocha');
const contact          = require('../lib/contact');

const str = '127.0.0.1:1234';
const obj = { id: 0, host: '127.0.0.1', port: 1234 };
const c = { host: '127.0.0.1', port: 1234 };

describe( 'contact', () => {
  it( 'creates contact from string', () => {
    const result = contact.new( str );
    assert.deepStrictEqual( result, c );
  });

  it( 'creates contact from object', () => {
    const result = contact.new( obj );
    assert.deepStrictEqual( result, c );
  });

  it( 'checks same contact', () => {
    assert( contact.equal( str, obj ) );
  });
});
