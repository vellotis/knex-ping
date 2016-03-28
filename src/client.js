var errors = require('./errors')

import { extend, pick, isFunction } from 'lodash'

module.exports = function(origClient) {
  var orig
  var overrides = {
    poolDefaults: function() {
      var client = this
      var poolDefaults = orig.poolDefaults.apply(this, arguments)
      return extend(poolDefaults, {
        ping: function(connection, callback) {
          if (isFunction(client.ping)) {
            client.ping(connection, callback)
          } else {
            process.nextTick(callback)
          }
        }
      })
    }
  }

  orig = pick(origClient, Object.keys(overrides))

  return overrides
}