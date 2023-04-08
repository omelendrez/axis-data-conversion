const bcrypt = require('bcrypt')

function execute(mySql, t) {
  return new Promise(async (resolve, reject) => {
    try {
      await mySql.query(t.drop)
      await mySql.query(t.create)
      const records = t.records

      const [r] = await mySql.query(t.insert, [records])
      const bold = '\033[1;97m'
      const reset = '\033[0m'

      console.log(bold + `  -> ${t.destinationTableName}` + reset)

      const summary = [
        { title: 'Read from MSSQL', records: 0 },
        { title: 'Inserted to MySQL', records: r.affectedRows }
      ]
      const transformed = summary.reduce((acc, { title, ...rest }) => { acc[title] = rest; return acc }, {})
      console.table(transformed)
      console.log()

      resolve([r.affectedRows])

    } catch (err) {
      console.dir(err)
      reject(err)
    }
  })
}

function updateTrainingStatus(sql, mySql, t) {
  return new Promise(async (resolve, reject) => {
    try {
      const fields = t.fields
        .map((f) => f.source)
        .join(',')
      const query = `SELECT ${fields} FROM ${process.env.MSSQL_DATABASE}.dbo.${t.sourceTableName}`

      const result = await sql.query(query)

      const updatedRows = result.recordset.length

      await result.recordset
        .forEach(async (r) => {
          let found = false
          await t.fields
            .forEach(async (f) => {
              if (!found && f.status && r[f.source]) {
                const status = f.status
                found = true
                const query = `UPDATE ${t.destinationTableName} SET status=${status} WHERE id=${r['ID']}`
                await mySql.query(query)
              }
            })
        })
      setTimeout(async () => {
        await mySql.query("UPDATE training SET status=10 WHERE delegate NOT IN (select id FROM delegate WHERE status=1);")
      })
      const bold = '\033[1;97m'
      const reset = '\033[0m'

      console.log(bold + `  -> ${t.destinationTableName}` + reset)

      const summary = [
        { title: 'Updated MySQL records', records: updatedRows }
      ]
      const transformed = summary.reduce((acc, { title, ...rest }) => { acc[title] = rest; return acc }, {})
      console.table(transformed)
      console.log()

      resolve([updatedRows])
    } catch (err) {
      console.dir(err)
      reject(err)
    }
  })
}

function secureUserPasswords(mySql) {
  return new Promise(async (resolve, reject) => {
    const users = await mySql.query('SELECT id, decrypt(password) `password` from user')
    users[0]
      .filter((user) => user.password.length > 0)
      .map(async (user) => {
        if (user.password) {
          const password = await bcrypt.hash(user.password.toLowerCase(), 10)
          await mySql.query("UPDATE user SET password = ? WHERE id = ?", [password, user.id])
        }
        resolve()
      })
  })
}

function addTracking(sql, mySql, t) {
  return new Promise(async (resolve, reject) => {
    try {
      await mySql.query(t.drop)
      await mySql.query(t.create)
      await mySql.query(t.index)
      const fields = t.fields

      const queryFields = []

      fields.forEach((f) => {
        queryFields.push(f.date)
        queryFields.push(f.user)
      })

      const query = `SELECT ID, ${queryFields.join(',')} FROM ${process.env.MSSQL_DATABASE}.dbo.${t.sourceTableName}`

      const result = await sql.query(query)
      const values = []
      result.recordset.map((r) => {
        fields.forEach(async (f) => {
          if (r[f.date] && r[f.user]) {
            values.push([r.ID, f.status, r[f.user], r[f.date]])
          }
        })
      })

      await mySql.query(t.insert, [values])

      resolve([result.recordset.length, values.length])
    }
    catch (err) {
      console.dir(err)
      reject(err)
    }
  })
}

module.exports = { execute, updateTrainingStatus, addTracking, secureUserPasswords }


