function convert(sql, mySql, t) {
  return new Promise(async (resolve, reject) => {
    try {
      const fields = t.fields.map((f) => f.source).join(',')
      const query = `SELECT ${fields} FROM ${process.env.MSSQL_DATABASE}.dbo.${t.sourceTableName}`
      const result = await sql.query(query)

      await mySql.query(t.drop)
      await mySql.query(t.create)
      if (t.index) {
        await mySql.query(t.index)
      }

      const records = []

      await result.recordset.forEach(async (r) => {
        const record = []
        t.fields.forEach((f) => {
          record.push(f.lowercase ? r[f.source].toLowerCase() : r[f.source])
        })
        records.push(record)
      })
      const [r] = await mySql.query(t.insert, [records])
      const bold = '\033[1;97m'
      const reset = '\033[0m'

      console.log(bold + `${t.sourceTableName} -> ${t.destinationTableName}` + reset)

      const summary = [
        { title: 'Read from MSSQL', records: result.recordset.length },
        { title: 'Inserted to MySQL', records: r.affectedRows },
        { title: 'Failed', records: result.recordset.length - r.affectedRows }
      ]
      const transformed = summary.reduce((acc, { title, ...rest }) => { acc[title] = rest; return acc }, {})
      console.table(transformed)
      console.log()

      resolve([result.recordset.length, r.affectedRows])

    } catch (error) {
      console.dir(error)
      reject(error)
    }
  })
}

module.exports = { convert }
