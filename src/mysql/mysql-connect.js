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

const pool = mysql.createPool({
  host: process.env.MYSQL_SERVER,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  port: process.env.MYSQL_PORT,
  database: process.env.MYSQL_DATABASE || 'axis',
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  multipleStatements: true
})

pool.getConnection((err, connection) => {
  if (err) throw err
  connection.release()
})

module.exports = pool
