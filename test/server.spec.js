'use strict';

const assert               = require('assert');
const { describe, it }     = require('mocha');
const { createConnection } = require('net');
const contact              = require('../lib/contact');
const Server               = require('../lib/server');
const Peer                 = require('../lib/peer');

let peers = [];
const server = new Server({
  host: 'localhost',
  port: 44444
});

const startServer = () => {
  it( 'starts the server', done => {
    server.init();
    server.start( done );
  });
};

const stopServer = () => {
  it( 'stops the server', () => {
    server.stop();
  });
};

const checkConnectedPeers = expected => {
  it( 'checks connected peers', () => {
    server.peers.forEach( ( peer, i ) => {
      assert( contact.equal( peer, expected[ i ] ) );
    });
  });
};

const updatePeers = () => {
  peers.forEach( peer => peer.peers = peers );
};

const addPeer = ( info, peer ) => {
  peer.contact = info;
  peer.start();
  peers.push( peer );
  updatePeers();
};

const removePeer = peer => {
  peer.stop();
  peers = contact.getOthers( peers, peer );
  updatePeers();
};

const connectPeer = info => {
  it( 'connects peer to server', done => {
    const conn = createConnection( server.contact, () => {
      const peer = new Peer( conn );
      peer.requestHandshake( info );
      peer.onceBefore( 'requestHandshake', data => {
        assert.deepStrictEqual( data, server.contact );
        peer.respondHandshake( true );
      });
      server.once( 'connectPeer', () => {
        addPeer( info, peer );
        done();
      });
    });
  });
};

const disconnectPeer = info => {
  it( 'disconnects peer from server', done => {
    const peer = contact.get( peers, info );
    peer.once( 'respondDisconnect', () => {
      removePeer( peer );
      done();
    });
    peer.requestDisconnect();
  });
};

describe( 'server', () => {
  startServer();
  connectPeer('localhost:44445');
  checkConnectedPeers([ `localhost:44445` ]);
  connectPeer('localhost:44446');
  checkConnectedPeers([ `localhost:44445`, `localhost:44446` ]);
  connectPeer('localhost:44447');
  disconnectPeer('localhost:44445');
  checkConnectedPeers([ `localhost:44446`, 'localhost:44447' ]);
  disconnectPeer('localhost:44446');
  checkConnectedPeers([ 'localhost:44447' ]);
  disconnectPeer('localhost:44447');
  checkConnectedPeers([]);
  stopServer();
});
