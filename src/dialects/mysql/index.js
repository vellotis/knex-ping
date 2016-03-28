module.exports = function(origClient) {
  return {
    ping: function(connection, callback) {
      try {
        connection.ping(callback)
      } catch (err) {
        process.nextTick(callback.bind(null, err))
      }
    }
  }
}