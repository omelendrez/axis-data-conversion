const mssql = require('../mssql/mssql-connect')
const mysql = require('../mysql/mysql-connect')

const { formatConsole } = require('../helpers')

function convert(t) {
  return new Promise(async (resolve, reject) => {
    const mySql = await mysql.connect()
    try {
      const sql = await mssql.connect()

      const db = process.env.MYSQL_DATABASE || 'axis'

      await mySql.query(`CREATE DATABASE IF NOT EXISTS ${db};`)
      await mySql.query(`USE ${db};`)

      const fields = t.fields.map((f) => f.source).join(',')
      const query = `SELECT ${fields} FROM ${process.env.MSSQL_DATABASE}.dbo.${t.sourceTableName}`
      const result = await sql.query(query)

      const actions = ['drop', 'create', 'index']
      let statement = ''

      actions.forEach((a) => {
        statement += t[a] ? t[a] : ''
      })

      await mySql.query(statement)

      const records = []

      await result.recordset.forEach(async (r) => {
        const record = []
        t.fields.forEach((f) => {
          let value = r[f.source]
          if (f.lowercase) {
            value = value.toLowerCase()
          }
          if (f.trim) {
            value = value.trim()
          }
          record.push(value)
        })
        records.push(record)
      })
      const [r] = await mySql.query(t.insert, [records])

      console.log(
        formatConsole(`${t.sourceTableName} -> ${t.destinationTableName}`)
      )

      const summary = [
        { title: 'Read from MSSQL', records: result.recordset.length },
        { title: 'Inserted to MySQL', records: r.affectedRows },
        { title: 'Failed', records: result.recordset.length - r.affectedRows }
      ]
      const transformed = summary.reduce((acc, { title, ...rest }) => {
        acc[title] = rest
        return acc
      }, {})
      console.table(transformed)
      console.log()

      resolve([result.recordset.length, r.affectedRows])
    } catch (error) {
      console.dir(error)
      reject(error)
    } finally {
      mySql.end()
    }
  })
}

module.exports = { convert }
