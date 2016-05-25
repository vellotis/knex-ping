var clientOverrider = require('./client')

import { assign } from 'lodash'

module.exports.attach = function(knex, handler) {
  assign(knex.Client.prototype, clientOverrider(knex.Client.prototype))

  var Knex = handler()

  var client = Knex.client
  var dialectName = client.dialect
  
  try {
  	var dialectOverrides = require('./dialects/' + dialectName)(client)
  	
  	assign(client, dialectOverrides)
  } catch (err) {
  	console.warn("knex-ping not implemented for dialect: " + dialectName)
  }

  return Knex
}