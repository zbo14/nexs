'use strict';

const EventEmitter                       = require('events');
const { createConnection, createServer } = require('net');
const contact                            = require('./contact');
const message                            = require('./message');
const Peer                               = require('./peer');

/**
 * Server
 */
class Server {
  /**
   * constructor
   * @param {Object} config
   * @param {string} [config.address = 'localhost']
   * @param {number} config.port
   * @param {Object} [config.state = {}]
   */
  constructor({ port, address = 'localhost', state = {} }) {
    this.address = address;
    this.port = port;
    this.state = state;
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
      setImmediate( cb, ...params )
    });
  }

  /**
   * getPeer
   * @param  {(Object|string)} c
   * @return {(Peer|undefined)}
   */
  getPeer( c ) {
    return this.peers.find( peer => contact.equal( c, peer ) );
  }

  /**
   * hasPeer
   * @param  {(Object|string)}  c
   * @return {Boolean}
   */
  hasPeer( c ) {
    return contact.equal( c, this ) || this.getPeer( c ) !== undefined;
  }

  /**
   * connect
   * @param  {(Object|string)} c
   */
  connect( c ) {
    if ( this.hasPeer( c ) ) {
      return this.emit('connected');
    }
    const path = contact.encode( c );
    const conn = createConnection( path, () => this.handshake( conn ) );
  }

  /**
   * handshake
   * @param  {net.Socket} conn
   */
  handshake( conn ) {
    const peer = new Peer( conn );
    peer.waitForMessage( ({ cmd, data }) => {
      if ( cmd !== 'requestHandshake' ) {
        this.error( `expected requestHandshake, got ${cmd}` );
        return peer.respondHandshake();
      }
      if ( this.hasPeer( data ) ) {
        this.emit('connected');
        return peer.respondHandshake();
      }
      peer.waitForMessage( msg => {
        if ( msg.cmd !== 'respondHandshake' ) {
          return this.error( `expected respondHandshake, got ${msg.cmd}` );
        }
        if ( !msg.data.success ) {
          return this.error('handshake failed');
        }
        if ( !this.hasPeer( data ) ) {
          this.addPeer( peer );
        }
        this.emit('connected');
      });
      peer.respondHandshake( true );
    });
    peer.requestHandshake( this );
  }

  /**
   * updateState
   * @param  {Object} state
   */
  updateState( state ) {
    this.state = state;
    this.peers.forEach( peer => peer.updateState( state ) );
  }

  /**
   * addPeer
   * @param {Peer} peer
   */
  addPeer( peer ) {
    this.peers.push( peer );
    peer.waitForMessages( ({ cmd, data })=> {
      switch ( cmd ) {
        case 'updateState':
          peer.handleUpdateState( data );
          return this.emit( 'updated', peer );
        default:
          this.error( `unexpected message type: ${msg.type}` );
      }
    });
  }

  /**
   * init
   */
  init() {
    this.peers = [];
    this.server = createServer( conn => this.handshake( conn ) );
    this.server.setMaxListeners( Infinity );
  }

  /**
   * start
   */
  start() {
    this.server.listen( this.port, this.address, () => this.emit('started') );
  }

  /**
   * stop
   */
  stop() {
    this.server.close();
  }
}

module.exports = Server;
