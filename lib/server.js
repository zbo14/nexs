'use strict';

const { createConnection, createServer } = require('net');
const contact                            = require('./contact');
const Peer                               = require('./peer');

/**
 * Server
 */
class Server {
  /**
   * constructor
   * @param {Object} config
   * @param {string} [config.host = 'localhost']
   * @param {number} config.port
   */
  constructor({ host = 'localhost', port }) {
    this.host = host;
    this.port = port;
  }

  get contact() {
    return contact.new( this );
  }

  /**
   * Initializes the server socket and peer list.
   */
  init() {
    this.peers = [];
    this.server = createServer( conn => this.handshake( conn ) );
    this.server.setMaxListeners( Infinity );
  }

  /**
   * Starts the server socket listening for connections.
   * @param {Function} cb
   */
  start( cb ) {
    this.server.listen( this.port, this.host, cb );
  }

  /**
   * Closes the server socket.
   */
  stop() {
    this.server.close();
  }

  /**
   * Connects the server to a peer with the given info.
   * @param  {Info} info
   */
  connectPeer( info ) {
    if ( this.hasPeer( info ) ) {
      return this.error('server already connected to peer');
    }
    const conn = createConnection( contact.new( info ), () => {
      this.handshake( conn );
    });
  }

  handshake( conn ) {
    const peer = new Peer( conn );
    peer.onceBefore( 'requestHandshake', info => {
      if ( this.hasPeer( info ) ) {
        peer.respondHandshake();
        return this.error('server is already connected to peer');
      }
      peer.onceBefore( 'respondHandshake', success => {
        if ( !success ) {
          return this.error('connect handshake failed');
        }
        peer.contact = info;
        if ( this.peers.length === 0 ) {
          return this.finishConnect( peer );
        }
        let count = 0;
        const peers = this.peers.concat( peer );
        this.peers.forEach( p => {
          p.once( 'respondPeers', () => {
            if ( ++count === this.peers.length ) {
              this.finishConnect( peer );
            }
          });
          p.requestPeers( peers );
        });
      });
      peer.respondHandshake( true );
    });
    peer.requestHandshake( this );
  }

  finishConnect( peer ) {
    peer.start();
    peer.once( 'requestDisconnect', () => {
      this.removePeer( peer );
      peer.respondDisconnect();
    });
    this.peers.push( peer );
    this.emit('connectPeer');
  }

  /**
   * Disconnects the server from a peer with the given info.
   * @param  {Info} info
   */
  disconnectPeer( info ) {
    const peer = this.getPeer( info );
    if ( peer === undefined ) {
      return this.error('server is not connected to peer');
    }
    peer.once( 'respondDisconnect', () => {
      const peers = this.getOtherPeers( info );
      if ( peers.length === 0 ) {
        this.finishDisconnect( peer, peers );
      }
      let count = 0;
      this.peers.forEach( p => {
        p.once( 'respondPeers', () => {
          if ( ++count === this.peers.length ) {
            this.finishDisconnect( peer, peers );
          }
        });
        p.requestPeers( peers );
      });
    });
    peer.requestDisconnect();
  }

  finishDisconnect( peer, peers ) {
    peer.stop();
    this.peers = peers;
    this.emit('disconnectPeer');
  }

  emit( eventName, ...params ) {
    this.server.emit( eventName, ...params );
  }

  error( msg ) {
    this.emit( 'error', new Error( msg ) );
  }

  on( eventName, cb ) {
    this.server.on( eventName, ( ...params ) => setImmediate( cb, ...params ) );
  }

  once( eventName, cb ) {
    this.server.once( eventName, ( ...params ) => {
      setImmediate( cb, ...params );
    });
  }

  getPeer( info ) {
    return contact.get( this.peers, info );
  }

  getOtherPeers( info ) {
    return contact.getOthers( this.peers, info );
  }

  removePeer( info ) {
    this.peers = this.getOtherPeers( info );
  }

  hasPeer( info ) {
    return contact.equal( info, this ) || this.getPeer( info ) !== undefined;
  }
}

module.exports = Server;
