'use strict';

const contact = require('./contact');
const message = require('./message');
const update  = require('./update');

/**
 * Peer
 */
class Peer {
  /**
   * constructor
   * @param {net.Socket} conn
   */
  constructor( conn ) {
    conn.setMaxListeners( Infinity );
    this.conn = conn;
    this._queue = [];
    this._peers = [];
    const handleData = message.decoder( this );
    this.on( 'data', handleData );
    this.on( 'message', msg => this.handleMessage( msg ) );
  }

  /**
   * Registers listeners on peer connection.
   */
  start() {
    this.on( 'requestPeers', data => this.handleRequestPeers( data ) );
  }

  /**
   * Closes the peer connection.
   */
  stop() {
    this.conn.end();
  }

  /**
   * Sends a requestHandshake message to the peer.
   * @param   {Info} info
   */
  requestHandshake( info ) {
    this.send({
      cmd: 'requestHandshake',
      data: contact.new( info )
    });
  }

  /**
   * Sends a respondHandshake message to the peer.
   * @param  {Boolean} [success=false]
   */
  respondHandshake( success = false ) {
    this.send({
      cmd: 'respondHandshake',
      data: success
    });
  }

  /**
   * Sends a requestDisconnect message to the peer.
   */
  requestDisconnect() {
    this.send({ cmd: 'requestDisconnect' });
  }

  /**
   * Sends a respondDisconnect message to the peer.
   */
  respondDisconnect() {
    this.send({ cmd: 'respondDisconnect' });
  }

  /**
   * Sends a requestPeers message to the peer.
   * @param  {Peer[]} [peers = []]
   */
  requestPeers( peers = [] ) {
    this.send({
      cmd: 'requestPeers',
      data: peers.map( peer => contact.new( peer ) )
    });
  }

  /**
   * Sends a respondPeers message to the peer.
   */
  respondPeers() {
    this.send({ cmd: 'respondPeers' });
  }

  handleMessage( msg ) {
    msg.resends = 0;
    this._queue.push( msg );
    this.emit( msg.cmd, msg.data );
    if ( msg.updates ) {
      this.emit( 'updates', msg.updates );
    }
  }

  getUpdates({ maxResends, maxUpdates }) {
    const numUpdates = Math.min( maxUpdates, this.queueSize );
    const updates = this._queue.slice( 0, numUpdates ).map( msg => {
      return update.new( this, msg );
    });
    for ( let i = 0; i < numUpdates; i++ ) {
      this._queue[ i ].resends++;
    }
    this._queue = [
      ...this._queue.slice( 0, numUpdates ).filter( ({ resends }) => {
        return resends < maxResends;
      }),
      ...this._queue.slice( numUpdates )
    ];
    return updates;
  }

  get contact() {
    return contact.new( this );
  }

  set contact( info ) {
    Object.assign( this, contact.new( info ) );
  }

  get peers() {
    return this._peers;
  }

  set peers( peers ) {
    this._peers = peers.filter( peer => !contact.equal( peer, this ) );
  }

  get queueSize() {
    return this._queue.length;
  }

  get queue() {
    return this._queue.map( ({ cmd, data }) => {
      return data === undefined ? { cmd } : { cmd, data };
    });
  }

  error( msg ) {
    this.emit( 'error', new Error( msg ) );
  }

  emit( eventName, ...params ) {
    this.conn.emit( eventName, ...params );
  }

  on( eventName, cb ) {
    this.conn.on( eventName, ( ...params ) => setImmediate( cb, ...params ) );
  }

  once( eventName, cb ) {
    this.conn.once( eventName, ( ...params ) => setImmediate( cb, ...params ) );
  }

  onceBefore( eventName, cb ) {
    let msg;
    for ( let i = 0; i < this.queueSize; i++ ) {
      msg = this._queue[ i ];
      if ( msg.cmd === eventName ) {
        return setImmediate( cb, msg.data );
      }
    }
    this.once( eventName, cb );
  }

  send( msg ) {
    this.conn.write( message.encode( msg ) );
  }

  getPeer( info ) {
    return this._peers.find( peer => contact.equal( info, peer ) );
  }

  getOtherPeers( info ) {
    return this._peers.filter( peer => !contact.equal( info, peer ) );
  }

  hasPeer( info ) {
    return contact.equal( info, this ) || this.getPeer( info ) !== undefined;
  }

  handleRequestPeers( peers ) {
    this.peers = peers;
    this.respondPeers();
  }
}

module.exports = Peer;
