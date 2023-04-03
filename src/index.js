require('dotenv').config()
const mssql = require('./mssql/mssql-connect')
const mysql = require('./mysql/mysql-connect')
const schemas = require('./mssql/schemas.json')
const data = require('./process/data-conversion')

async function run() {
  try {
    console.log()
    console.log('AXIS DATA CONVERSION: Starting')
    console.log()

    console.log('Connecting to MSSQL')
    console.log()

    const sql = await mssql.connect()

    console.log('Connecting to MySQL')
    console.log()

    const mySql = await mysql.connect()

    const db = process.env.MYSQL_DATABASE || 'axis'

    console.log('Creating MySQL database if not exists')
    console.log()

    await mySql.query(`CREATE DATABASE IF NOT EXISTS ${db};`)
    await mySql.query(`USE ${db};`)

    console.log('Migration started:')
    console.log()

    let totalRecords = 0
    let processed = 0
    let tables = 0

    await Promise.all(
      schemas
        .filter((t) => !t.isDone)
        .map(async (t) => {
          const [read, inserted] = await data.convert(sql, mySql, t)
          totalRecords += read
          processed += inserted
          tables++
        })
    )

    console.log('Total tables processed:', tables)
    console.log('Total records read from MSSQL:', totalRecords)
    console.log('Total records inserted to MySQL:', processed)
    console.log()
    console.log('AXIS DATA CONVERSION: Completed')

    setTimeout(() => process.exit(), 1000)

  } catch (err) {
    console.dir(err)
  }
}

process.stdin.setRawMode(true)
process.stdin.resume()
process.stdin.on('data', process.exit.bind(process, 0))

run()
