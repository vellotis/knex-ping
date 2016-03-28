module.exports = function(origClient) {
  return {
    ping: function(connection, callback) {
      if (connection.native && !connection._connected) {
        process.nextTick(callback.bind(null, new Error('Not connected to database')))
        return
      }
      process.nextTick(callback)
    }
  }
}