const assert = require('assert').strict
const mysql = require('mysql2/promise')

assert.ok(
  process.env.MYSQL_SERVER,
  'The "MYSQL_SERVER" environment variable is required'
)
assert.ok(
  process.env.MYSQL_USER,
  'The "MYSQL_USER" environment variable is required'
)
assert.ok(
  process.env.MYSQL_PASSWORD,
  'The "MYSQL_PASSWORD" environment variable is required'
)

const connect = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_SERVER,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      port: process.env.MYSQL_PORT,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      queueLimit: 0,
      multipleStatements: true
    })
    connection.connect()
    return connection
  } catch (err) {
    console.dir(err)
  }
}

module.exports = { connect }
