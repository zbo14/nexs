'use strict';

/** @module update */

const contact = require('./contact');

/**
 * @global
 * @typedef  {Object}   Update
 * @property {string}   cmd
 * @property {Object}   data
 * @property {Contact}  peer
 */

/**
 * new
 * @param  {Info}     info
 * @param  {Message}  msg
 * @return {Update}
 */
exports.new = ( info, msg ) => ({
  cmd:  msg.cmd,
  data: msg.data,
  peer: contact.new( info )
});
