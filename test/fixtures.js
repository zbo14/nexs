'use strict';

exports.requestHandshake = contact => ({
  cmd: 'requestHandshake',
  data: contact
});

exports.respondHandshake = success => ({
  cmd: 'respondHandshake',
  data: success
});

exports.requestPeers = ( contacts = [] ) => ({
  cmd: 'requestPeers',
  data: contacts
});

exports.respondPeers = () => ({
  cmd: 'respondPeers'
});
