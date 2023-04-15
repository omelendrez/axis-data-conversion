const bcrypt = require('bcrypt')
const mysql = require('../mysql/mysql-connect')

const { formatConsole } = require('../helpers')

const execute = (mySql, t) => {
  return new Promise(async (resolve, reject) => {
    try {
      const actions = ['drop', 'create', 'index']
      let statement = ''

      actions.forEach((a) => {
        statement += t[a] ? t[a] : ''
      })

      await mySql.query(statement)

      const records = t.records

      const [r] = await mySql.query(t.insert, [records])

      console.log(formatConsole(t.destinationTableName))

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

const updateTrainingStatus = (sql, mySql, t) => {
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
                const id = r['ID']
                found = true
                const query = `UPDATE ${t.destinationTableName} SET status=${status} WHERE id=${id}`
                await mySql.query(query)
              }
            })
        })

      await mySql.query("UPDATE training SET status=11 WHERE learner NOT IN (select id FROM learner WHERE status=1);")

      console.log(formatConsole(t.destinationTableName))

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

const secureUserPasswords = (mySql, t) => {
  return new Promise(async (resolve, reject) => {

    try {

      await mySql.query(t.fnCreate)

      let updated = 0

      console.log(formatConsole(t.title))

      const [passwords] = await mySql.query(t.query)
      updated = passwords.length

      await passwords
        .forEach(async (user) => {
          const password = await bcrypt.hash(user.password.toLowerCase(), 10)
          await mySql.query(t.update, [password, user.id])
        })

      const summary = [
        { title: 'Updated user passwords', records: updated }
      ]
      const transformed = summary.reduce((acc, { title, ...rest }) => { acc[title] = rest; return acc }, {})
      console.table(transformed)
      console.log()

      resolve([updated])

    } catch (error) {
      console.dir(error)
      reject(error)
    }
  })
}

const addTracking = (sql, mySql, t) => {
  return new Promise(async (resolve, reject) => {
    try {
      const actions = ['drop', 'create', 'index']
      let statement = ''

      console.log(formatConsole('tracking'))

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

      const query = `SELECT ID, ${queryFields.join(',')} FROM ${process.env.MSSQL_DATABASE}.dbo.${t.sourceTableName}`

      const result = await sql.query(query)
      const values = []
      result.recordset.forEach((r) => {
        fields.forEach(async (f) => {
          if (r[f.date] && r[f.user]) {
            values.push([r.ID, f.status, r[f.user], r[f.date]])
          }
        })
      })

      const result2 = await mySql.query(t.insert, [values])
      const updatedRows = result2[0].affectedRows

      const summary = [
        { title: 'Generated MySQL records', records: updatedRows }
      ]
      const transformed = summary.reduce((acc, { title, ...rest }) => { acc[title] = rest; return acc }, {})
      console.table(transformed)
      console.log()

      resolve([result.recordset.length, updatedRows])
    }
    catch (err) {
      console.dir(err)
      reject(err)
    }
  })
}

const executeProcedure = async (t) => {
  const mySql = await mysql.connect()
  const db = process.env.MYSQL_DATABASE || 'axis'
  await mySql.query(`USE ${db};`)

  return new Promise(async (resolve, reject) => {
    try {

      console.log(formatConsole(t.title))

      const [res] = await mySql.query(t.update)
      const updatedRows = res[1].affectedRows

      const summary = [
        { title: t.title, records: updatedRows }
      ]

      const transformed = summary.reduce((acc, { title, ...rest }) => { acc[title] = rest; return acc }, {})

      console.table(transformed)
      console.log()

      resolve([updatedRows])

    }
    catch (err) {
      console.dir(err)
      reject(err)
    }
  })
}

module.exports = { execute, updateTrainingStatus, addTracking, secureUserPasswords, executeProcedure }


