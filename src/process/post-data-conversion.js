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

    } catch (error) {
      console.dir(error)
      reject(error)
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
        await mySql.query("UPDATE training SET status=0 WHERE delegate NOT IN (select id FROM delegate WHERE status=1);")
        console.log('here')
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
    } catch (error) {
      console.dir(error)
      reject(error)
    }
  })
}

function addTracking(sql, mySql, t) {
  return new Promise((resolve, reject) => {
    console.log(t)
    resolve([123])
  })
}


module.exports = { execute, updateTrainingStatus, addTracking }


// select 'persons without any training' error, COUNT(1) records
// from tblPersonnel
// where ID not in (select EmpID from empTraining)

// union

// select 'persons that are subcontractors', COUNT(1)
// from tblPersonnel where pertype='SUB'

// union

// select 'training records with wrong course', COUNT (1)
// from empTraining
// where CourseCode not in (select CourseCode from tblHSECourses)

// union

// select 'persons with wrong course code', COUNT (1)
// from tblPersonnel
// where ID in (select EmpID from empTraining where CourseCode not in (select CourseCode from tblHSECourses))

// union

// select 'persons without client (0000 *UNDEFINED*)', COUNT(1) from tblPersonnel where agencode='0000'

// union

// select 'persons without job title (000000 PENDING)', COUNT(1) from tblPersonnel where posicode= '000000'
