var knexPing = require('..')
var sinon = require('sinon')
sinon.config = {
  useFakeTimers: false
}
require('should')
require('should-sinon')

var spies = {
  acquireRawConnection: null
}

var knex, Knex, connection, obj

describe('Unit tests', function() {
  describe('pool2 instance', function () {
    describe('when pool2 ping capability not attached', function() {
      beforeEach(function() {
        knex = require('knex')
        Knex = knex({
          client: 'mysql',
          connection: {
            host     : '127.0.0.1',
            user     : 'your_database_user',
            password : 'your_database_password',
            database : 'myapp_test'
          },
          pool: {
            min: 1,
            max: 1
          }
        })
        Knex.client.acquireRawConnection = spies.acquireRawConnection = sinon.stub()
        connection = {}
      })

      afterEach(function() {
        Knex = knex = null
      })

      it('should just invoke callback', sinon.test(function(done) {
        spies.poolPing = sinon.spy(Knex.client.pool, '_ping')
        Knex.client.acquireRawConnection.withArgs().returns(Knex.Promise.resolve(connection))

        Knex.client.acquireConnection().then(function(conn) {
          conn.should.be.eql(connection)
          spies.poolPing.withArgs(connection, sinon.match.func).should.be.calledOnce()
          done()
        })
      }))
    })
  })

  describe('when pool2 ping capability attached', function () {
    describe('MySQL dialect', function () {
      beforeEach(function() {
        knex = require('knex')
        Knex = knexPing.attach(knex, function () {
          return knex({
            client: 'mysql',
            connection: {
              host     : '127.0.0.1',
              user     : 'your_database_user',
              password : 'your_database_password',
              database : 'myapp_test'
            },
            pool: {
              min: 1,
              max: 1,
              requestTimeout: 10
            }
          })
        })
        Knex.client.acquireRawConnection = spies.acquireRawConnection = sinon.stub()
        Knex.client.destroyRawConnection = spies.destroyRawConnection = sinon.stub()
        Knex.client.ping = spies.ping = sinon.stub()
        connection = {}
      })

      afterEach(function() {
        spies = {}
        Knex = knex = null
      })

      it('should invoke callback with client.ping', sinon.test(function(done) {
        spies.poolPing = sinon.spy(Knex.client.pool, '_ping')
        spies.acquireRawConnection.withArgs().returns(Knex.Promise.resolve(connection))
        spies.ping.withArgs(connection, sinon.match.func).yields(null)

        Knex.client.acquireConnection().then(function(conn) {
          conn.should.be.eql(connection)
          spies.poolPing.withArgs(connection, sinon.match.func).should.be.calledOnce()
          spies.ping.withArgs(connection, sinon.match.func).should.be.calledOnce()
          done()
        })
      }))

      it('should timeout if client.ping returns error', sinon.test(function(done) {
        spies.poolPing = sinon.spy(Knex.client.pool, '_ping')
        //
        // Some why I am not able to do following. Starts to loop. Instead I have to do manual stub.
        //
        // spies.acquireRawConnection.withArgs().returns(new Knex.Promise(function(resolver, rejecter) {
        //   return process.nextTick(function(){ resolver(connection) })
        // }))
        //
        spies.acquireRawConnection = sinon.spy()
        Knex.client.acquireRawConnection = function() {
          spies.acquireRawConnection()
          return new Knex.Promise(function(resolver, rejecter) {
            process.nextTick(function(){ resolver(connection) })
          })
        }
        spies.destroyRawConnection.withArgs(connection, sinon.match.func).yields(Knex.Promise.resolve(null))
        spies.ping.withArgs(connection, sinon.match.func).yields(new Error("As expected"))

        var pool = Knex.client.pool

        Knex.client.acquireConnection().then(function() {
            throw new Error('Should fail')
          }, function(err) {
            err.should.be.instanceOf(Error)
            err.message.should.be.equal('ResourceRequest timed out')
            spies.poolPing.withArgs(connection, sinon.match.func).should.be.called()
            spies.ping.withArgs(connection, sinon.match.func).should.be.called()
            done()
          }).finally(function () {
            pool.end()
          })
      }))
    })

  })
})