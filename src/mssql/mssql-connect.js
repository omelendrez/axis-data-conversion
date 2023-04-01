const assert = require('assert').strict
const sql = require('mssql')

assert.ok(process.env.MSSQL_SERVER, 'The "MSSQL_SERVER" environment variable is required')
assert.ok(process.env.MSSQL_DATABASE, 'The "MSSQL_DATABASE" environment variable is required')
assert.ok(process.env.MSSQL_USER, 'The "MSSQL_USER" environment variable is required')
assert.ok(process.env.MSSQL_PASSWORD, 'The "MSSQL_PASSWORD" environment variable is required')

const connect = async () => {
  try {
    return await sql.connect({
      server: process.env.MSSQL_SERVER,
      database: process.env.MSSQL_DATABASE,
      user: process.env.MSSQL_USER,
      password: process.env.MSSQL_PASSWORD,
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      },
      options: {
        encrypt: false,
        trustServerCertificate: true
      }
    })
  } catch (err) {
    console.dir(err)
  }
}

module.exports = { connect }
