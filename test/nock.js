/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 "use strict";

var Filesystem = require('../loop/filestorage/filesystem');

var local = new Filesystem({base_dir: '/tmp'});

function mock(options) {
  var _nock = require('nock');
  _nock.enableNetConnect(/127.0.0.1|localhost/);
  var bucket = options.bucket;
  var u = '/' + bucket + '/XXX';
  var id;
  var outstandingMocks = [];

  function nock() {
    var scope = _nock.apply(_nock, arguments);
    outstandingMocks.push(scope);
    return scope;
  }

  function done(verifyNock) {
    if (verifyNock) {
      outstandingMocks.forEach(function(mock) {
        mock.done();
      });
    }
    outstandingMocks = [];
    _nock.cleanAll();
  }

  function writeAws() {
    return nock('https://s3.amazonaws.com')
      .filteringPath(function filter(_path) {
        id = _path.replace('/' + bucket + '/', '');
        return _path.replace(id, 'XXX');
      })
      .put(u)
      .reply(200, function(uri, body, callback) {
        local.write(id, body, function(err) {
          if (err) throw err;
          callback(err);
        });
      });
  }

  function readAws() {
    return nock('https://s3.amazonaws.com')
      .filteringPath(function filter(_path) {
        id = _path.replace('/' + bucket + '/', '');
        return _path.replace(id, 'XXX');
      })
      .get(u)
      .reply(200, function(uri, body, callback) {
        local.read(id, function(err, data) {
          if (err) throw err;
          callback(err, data);
        });
      });
  }

  function removeAws() {
    return nock('https://s3.amazonaws.com')
      .filteringPath(function filter(_path) {
        id = _path.replace('/' + bucket + '/', '');
        return _path.replace(id, 'XXX');
      })
      .delete(u)
      .reply(204, function(uri, body, callback) {
        local.remove(id, function() {
          callback(null);
        });
      });
  }

  return {
    readAws: readAws,
    writeAws: writeAws,
    removeAws: removeAws,
    done: done
  };
}

module.exports = mock;
