'use strict';

const assert               = require('assert');
const { describe, it }     = require('mocha');
const { createConnection } = require('net');
const Server               = require('../lib/server');
const Peer                 = require('../lib/peer');

let peer;
let server;

const port = 22222;

describe( 'server', () => {
  it( 'creates a server', () => {
    server = new Server({ port });
  });

  it( 'initializes a server', () => {
    server.init();
  });

  it( 'starts a server', done => {
    server.once( 'started', done );
    server.start();
  });

  it( 'creates a peer and connects it to the server', done => {
    const conn = createConnection( port, () => {
      peer = new Peer( conn );
      done();
    });
  });

  it( 'receives server requestHandshake', done => {
    peer.waitForMessage( msg => {
      assert.deepStrictEqual( msg, {
        cmd: 'requestHandshake',
        data: { address: 'localhost', port }
      });
      done();
    });
  });

  it( 'sends peer requestHandshake', () => {
    peer.requestHandshake({ address: 'localhost', port: port + 1 });
  });

  it( 'receives server respondHandshake', done => {
    peer.waitForMessage( msg => {
      assert.deepStrictEqual( msg, {
        cmd: 'respondHandshake',
        data: { success: true }
      });
      done();
    });
  });

  it( 'sends peer respondHandshake', () => {
    peer.respondHandshake( true );
  });

  it( 'checks that server has 1 peer', () => {
    assert.equal( server.peers.length, 1 );
  });

  it( 'sends and receives server updateState', done => {
    peer.waitForMessage( msg => {
      assert.deepStrictEqual( msg, {
        cmd: 'updateState',
        data: { a: 1 }
      });
      done();
    });
    server.updateState({ a: 1 });
  });

  it( 'receives peer updateState', done => {
    server.once( 'updated', peer => {
      assert.deepStrictEqual( peer.state, { b: 2 });
      done();
    });
    peer.updateState({ b: 2 });
  });

  it( 'stops a server', () => {
    server.stop();
  });
});
