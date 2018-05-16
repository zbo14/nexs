'use strict';

const assert                             = require('assert');
const { describe, it }                   = require('mocha');
const { createConnection, createServer } = require('net');
const Peer                               = require('../lib/peer');
const message                            = require('../lib/message');

let peer;

const port = 22222;

describe( 'peer', () => {
  it( 'starts the server', done => {
    createServer( conn => {
      const handleData = message.decoder( peer );
      conn.on( 'data', handleData );
    }).listen( port, done );
  });

  it( 'creates a peer', done => {
    const conn = createConnection( port, () => {
      peer = new Peer( conn );
      done();
    });
  });

  it( 'sends a requestHandshake to peer', done => {
    peer.waitForMessage( msg => {
      assert.deepStrictEqual( msg, {
        cmd: 'requestHandshake',
        data: { address: 'localhost', port }
      });
      done();
    });
    peer.requestHandshake({ address: 'localhost', port });
  });

  it( 'sends a respondHandshake to peer', done => {
    peer.waitForMessage( msg => {
      assert.deepStrictEqual( msg, {
        cmd: 'respondHandshake',
        data: { success: false }
      });
      done();
    });
    peer.respondHandshake();
  });

  it( 'sends an updateState to peer', done => {
    peer.waitForMessage( msg => {
      assert.deepStrictEqual( msg, {
        cmd: 'updateState',
        data: { a: 1 }
      });
      done();
    });
    peer.updateState({ a: 1 });
  });

  it( 'closes the peer', () => {
    peer.close();
  });
});
