const mssql = require('../mssql/mssql-connect')
const mysqlpool = require('../mysql/mysql-connect')
const fs = require('fs')
const path = require('path')

const { formatConsole } = require('../helpers')

function init() {
  return new Promise(async (resolve, reject) => {
    const mySql = await mysqlpool

    try {
      const functionsPath = path.join(__dirname, '..', 'schema', 'functions')

      await fs.readdirSync(functionsPath).map(async (fileName) => {
        const fullPath = path.join(functionsPath, fileName)
        const file = await require(fullPath)

        const displayFunction = fileName.split('.')[0]

        console.log(`- Create function ${displayFunction}.`)

        const query = file?.query
        if (query) {
          await mySql.query(query)
          resolve()
        } else {
          const message = `Couldn't load file ${fullPath}`
          console.log(message)
          reject(message)
        }
      })
    } catch (error) {}
  })
}

function convert(t) {
  return new Promise(async (resolve, reject) => {
    const sql = await mssql.connect()

    const mySql = await mysqlpool

    try {
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
    }
  })
}

module.exports = { init, convert }
