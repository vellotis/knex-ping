module.exports = function(origClient) {
  return {
    ping: function(connection, callback) {
      if (connection.connecting) {
        var listener = function(err) {
          connection.removeListener('close', listener)
          connection.removeListener('connect', listener)

          callback(err)
        }
        connection.on('close', listener)
        connection.on('connect', listener)
      } else if (connection.connected) {
        process.nextTick(callback)
      } else {
        process.nextTick(callback.bind(null, new Error('Not connected to database')))
      }
    }
  }
}