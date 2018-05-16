'use strict';

const contact = require('./contact');
const message = require('./message');

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
    this.msgs = [];
    this.state = {};
    const handleData = message.decoder( this );
    this.on( 'data', handleData );
    this.on( 'queue', msg => {
      this.msgs.push( msg );
      this.emit('dequeue');
    });
  }

  waitForMessages( cb ) {
    this.msgs.forEach( cb );
    this.msgs = [];
    this.on( 'dequeue', () => cb( this.msgs.shift() ) );
  }

  waitForMessage( cb ) {
    if ( this.msgs.length ) {
      return cb( this.msgs.shift() );
    }
    this.once( 'dequeue', () => cb( this.msgs.shift() ) );
  }

  emit( eventName, ...params ) {
    this.conn.emit( eventName, ...params );
  }

  on( eventName, cb ) {
    this.conn.on( eventName, ( ...params ) => cb( ...params ) );
  }

  once( eventName, cb ) {
    this.conn.once( eventName, ( ...params ) => cb( ...params ) );
  }

  /**
   * send
   * @param   {Message} msg
   */
  send( msg ) {
    this.conn.write( message.encode( msg ) );
  }

  /**
   * updateState
   * @param  {Object} state
   */
  updateState( state ) {
    this.send({
      cmd: 'updateState',
      data: state
    });
  }

  /**
   * handleUpdateState
   * @param  {Object} state
   */
  handleUpdateState( state ) {
    this.state = state;
  }

  /**
   * Sends a requestHandshake message to the peer.
   *
   * requestHandshake
   * @param   {(Object|string)} c
   */
  requestHandshake( c ) {
    this.send({
      cmd: 'requestHandshake',
      data: contact.decode( c )
    });
  }

  /**
   * Sends a respondHandshake message to the peer.
   *
   * respondHandshake
   * @param  {Boolean} [success=false]
   */
  respondHandshake( success = false ) {
    this.send({
      cmd: 'respondHandshake',
      data: { success }
    });
  }

  /**
   * close
   */
  close() {
    this.conn.end();
  }
}

module.exports = Peer;
