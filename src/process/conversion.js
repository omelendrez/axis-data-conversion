const mssql = require('../mssql/mssql-connect')
const mysqlpool = require('../mysql/mysql-connect')
const bcrypt = require('bcrypt')

const { formatConsole } = require('../helpers')

const execute = (t) => {
  return new Promise(async (resolve, reject) => {
    const mySql = await mysqlpool

    try {
      const actions = ['drop', 'create', 'index']
      let statement = ''

      actions.forEach((a) => {
        statement += t[a] ? t[a] : ''
      })

      if (statement.length) {
        await mySql.query(statement)
      }

      const records = t.records

      const [r] = await mySql.query(t.insert, [records])

      console.log(formatConsole(t.destinationTableName))

      const summary = [
        { title: 'Read from MSSQL', records: 0 },
        { title: 'Inserted to MySQL', records: r.affectedRows }
      ]
      const transformed = summary.reduce((acc, { title, ...rest }) => {
        acc[title] = rest
        return acc
      }, {})
      console.table(transformed)
      console.log()

      resolve([r.affectedRows])
    } catch (err) {
      console.dir(err)
      reject(err)
    }
  })
}

const updateTrainingStatus = (t) => {
  return new Promise(async (resolve, reject) => {
    const mySql = await mysqlpool

    try {
      const fields = t.fields.map((f) => f.source).join(',')
      const query = `SELECT ${fields} FROM ${process.env.MSSQL_DATABASE}.dbo.${t.sourceTableName}`

      const result = await sql.query(query)

      const updatedRows = result.recordset.length

      await result.recordset.forEach(async (r) => {
        let found = false
        await t.fields.forEach(async (f) => {
          if (!found && f.status && r[f.source]) {
            const status = f.status
            const id = r['ID']
            found = true
            const query = `UPDATE ${t.destinationTableName} SET status=${status} WHERE id=${id}`
            await mySql.query(query)
          }
        })
      })

      console.log(formatConsole(t.destinationTableName))

      const summary = [{ title: 'Updated MySQL records', records: updatedRows }]
      const transformed = summary.reduce((acc, { title, ...rest }) => {
        acc[title] = rest
        return acc
      }, {})
      console.table(transformed)
      console.log()

      resolve([updatedRows])
    } catch (err) {
      console.dir(err)
      reject(err)
    }
  })
}

const secureUserPasswords = async (t) => {
  return await new Promise(async (resolve, reject) => {
    const mySql = await mysqlpool

    try {
      console.log(formatConsole(t.title))

      let updated = 0

      await mySql.query(t.fnCreate)

      const [passwords] = await mySql.query(t.query)
      updated = passwords.length

      await passwords.forEach(async (user) => {
        const password = await bcrypt.hash(user.password.toLowerCase(), 10)
        await mySql.query(t.update, [password, user.id])
      })

      await mySql.query(t.fnDrop)

      const summary = [{ title: 'Updated user passwords', records: updated }]
      const transformed = summary.reduce((acc, { title, ...rest }) => {
        acc[title] = rest
        return acc
      }, {})
      console.table(transformed)
      console.log()

      resolve([updated])
    } catch (error) {
      console.dir(error)
      reject(error)
    }
  })
}

const addTracking = (t) => {
  return new Promise(async (resolve, reject) => {
    const sql = await mssql.connect()

    const mySql = await mysqlpool

    try {
      const actions = ['drop', 'create', 'index']
      let statement = ''

      console.log(formatConsole('training_tracking'))

      actions.forEach((a) => {
        statement += t[a] ? t[a] : ''
      })

      await mySql.query(statement)

      const fields = t.fields

      const queryFields = []

      fields.forEach((f) => {
        queryFields.push(f.date)
        queryFields.push(f.user)
      })

      const query = `SELECT ID, ${queryFields.join(',')} FROM ${
        process.env.MSSQL_DATABASE
      }.dbo.${t.sourceTableName}`

      const result = await sql.query(query)
      const values = []
      result.recordset.forEach((r) => {
        const status = []
        fields.forEach(async (f) => {
          if (r[f.date] && r[f.user] !== null) {
            for (let st = 1; st <= f.status; st++) {
              if (!status.includes(st)) {
                values.push([r.ID, st, r[f.user], r[f.date]])
                status.push(st)
              }
            }
          }
          // const complete = 11
          // if (status.length > 8 && !status.includes(complete)) {
          //   values.push([r.ID, complete, r[f.user], r[f.date]])
          //   status.push(complete)
          // }
        })
      })

      const result2 = await mySql.query(t.insert, [values])
      const updatedRows = result2[0].affectedRows

      const summary = [
        { title: 'Generated MySQL records', records: updatedRows }
      ]
      const transformed = summary.reduce((acc, { title, ...rest }) => {
        acc[title] = rest
        return acc
      }, {})
      console.table(transformed)
      console.log()

      resolve([result.recordset.length, updatedRows])
    } catch (err) {
      console.dir(err)
      reject(err)
    }
  })
}

const executeProcedure = async (t) => {
  return new Promise(async (resolve, reject) => {
    const mySql = await mysqlpool

    try {
      let updatedRows = 0

      await Promise.all(
        t.steps.map(async (s) => {
          const [res] = await mySql.query(s)
          updatedRows += res.affectedRows
        })
      )

      const summary = [{ title: t.title, records: updatedRows }]

      const transformed = summary.reduce((acc, { title, ...rest }) => {
        acc[title] = rest
        return acc
      }, {})

      console.table(transformed)
      console.log()

      resolve([updatedRows])
    } catch (err) {
      console.dir(err)
      reject(err)
    }
  })
}

module.exports = {
  execute,
  updateTrainingStatus,
  addTracking,
  secureUserPasswords,
  executeProcedure
}
