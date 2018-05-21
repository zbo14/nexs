'use strict';

const assert                             = require('assert');
const { describe, it }                   = require('mocha');
const { createConnection, createServer } = require('net');
const Peer                               = require('../lib/peer');
const message                            = require('../lib/message');
const update                             = require('../lib/update');
const fixtures                           = require('./fixtures');

let peer;

const contact = {
  host: 'localhost',
  port: 22222
};

const otherContact = {
  host: 'localhost',
  port: 22223
};

const startServer = () => {
  it( 'starts the server', done => {
    createServer( conn => {
      const handleData = message.decoder( peer );
      conn.on( 'data', handleData );
    }).listen( contact, done );
  });
};

const startPeer = () => {
  it( 'starts the peer', () => peer.start() );
};

const stopPeer = () => {
  it( 'stops the peer', () => peer.stop() );
};

const createPeer = () => {
  it( 'creates a peer', done => {
    const conn = createConnection( contact, () => {
      peer = new Peer( conn );
      done();
    });
  });
};

const handshake = () => {
  it( 'does handshake', done => {
    peer.requestHandshake( contact );
    peer.onceBefore( 'requestHandshake', info => {
      assert.deepStrictEqual( info, contact );
      peer.respondHandshake( true );
    });
    peer.onceBefore( 'respondHandshake', data => {
      assert.equal( data, true );
      done();
    });
  });
};

const addPeer = () => {
  it( 'adds peer', done => {
    peer.once( 'requestPeers', data => {
      assert.deepStrictEqual( data, [ otherContact ]);
    });
    peer.once( 'respondPeers', () => {
      assert.deepStrictEqual( peer.peers, [ otherContact ]);
      done();
    });
    peer.requestPeers([ otherContact ]);
  });
};

const removePeer = () => {
  it( 'removes peer', done => {
    peer.once( 'requestPeers', data => {
      assert.deepStrictEqual( data, [] );
    });
    peer.once( 'respondPeers', () => {
      assert.deepStrictEqual( peer.peers, [] );
      done();
    });
    peer.requestPeers();
  });
};

const checkQueue = msgs => {
  it( 'checks message queue', () => {
    assert.deepStrictEqual( peer.queue, msgs );
  });
};

const checkUpdates = ({ params, messages }) => {
  it( 'checks message updates', () => {
    const updates = messages.map( msg => update.new( peer, msg ) );
    assert.deepStrictEqual( peer.getUpdates( params ), updates );
  });
};

describe( 'peer', () => {
  startServer();
  createPeer();
  startPeer();
  handshake();
  checkQueue([
    fixtures.requestHandshake( contact ),
    fixtures.respondHandshake( true )
  ]);
  addPeer();
  checkQueue([
    fixtures.requestHandshake( contact ),
    fixtures.respondHandshake( true ),
    fixtures.requestPeers([ otherContact ]),
    fixtures.respondPeers()
  ]);
  removePeer();
  checkQueue([
    fixtures.requestHandshake( contact ),
    fixtures.respondHandshake( true ),
    fixtures.requestPeers([ otherContact ]),
    fixtures.respondPeers(),
    fixtures.requestPeers(),
    fixtures.respondPeers()
  ]);
  checkUpdates({
    params: { maxResends: 1, maxUpdates: 2 },
    messages: [
      fixtures.requestHandshake( contact ),
      fixtures.respondHandshake( true )
    ]
  });
  checkQueue([
    fixtures.requestPeers([ otherContact ]),
    fixtures.respondPeers(),
    fixtures.requestPeers(),
    fixtures.respondPeers()
  ]);
  checkUpdates({
    params: { maxResends: 1, maxUpdates: 5 },
    messages: [
      fixtures.requestPeers([ otherContact ]),
      fixtures.respondPeers(),
      fixtures.requestPeers(),
      fixtures.respondPeers()
    ]
  });
  checkQueue([]);
  stopPeer();
});
