require('dotenv').config()
const migrationSchemas = require('./schema/migration.json')
const conversionSchemas = require('./schema/conversion.json')

const data = require('./process/migration')
const post = require('./process/conversion')
const {
  createTable,
  updateLearners,
  convertData
} = require('./process/post-process')

async function run() {
  try {
    console.log()
    console.log('AXIS DATA CONVERSION: Starting')
    console.log()

    let readRecords = 0
    let insertedRecords = 0
    let tables = 0
    let updatedRecords = 0

    await Promise.all([data.init()])

    await Promise.all(
      migrationSchemas
        .filter((t) => !t.isDone)
        .map(async (t) => {
          const [read, inserted] = await data.convert(t)
          readRecords += read
          insertedRecords += inserted
          tables++
        })
    )

    await Promise.all(
      conversionSchemas
        .filter((t) => !t.isDone && t.isSecure)
        .map(async (t) => {
          const [updated] = await post.secureUserPasswords(t)
          updatedRecords += updated
        })
    )

    await Promise.all(
      conversionSchemas
        .filter((t) => !t.isDone && t.isInsert)
        .map(async (t) => {
          const [read, inserted] = await post.addTracking(t)
          readRecords += read
          insertedRecords += inserted
          tables++
        })
    )

    await Promise.all(
      conversionSchemas
        .filter((t) => !t.isDone && !t.isUpdate && !t.isInsert && !t.isSecure)
        .map(async (t) => {
          const [inserted] = await post.execute(t)
          insertedRecords += inserted
          tables++
        })
    )

    await Promise.all(
      conversionSchemas
        .filter((t) => !t.isDone && t.isUpdate)
        .map(async (t) => {
          const [updatedRows] = await post.executeProcedure(t)
          updatedRecords += updatedRows
        })
    )

    await createTable()
    await updateLearners()
    await convertData()

    console.log()

    console.log('Total tables processed:', tables)
    console.log('Total records read from MSSQL:', readRecords)
    console.log('Total records inserted to MySQL:', insertedRecords)
    console.log('Total records updated in MySQL:', updatedRecords)
    console.log()
    console.log('AXIS DATA CONVERSION: Completed')

    setTimeout(() => process.exit(), 1000)
  } catch (err) {
    console.dir(err)
    setTimeout(() => process.exit(), 1000)
  }
}

if (process.stdin.isTTY) {
  process.stdin.setRawMode(true)
}
process.stdin.resume()
process.stdin.on('data', process.exit.bind(process, 0))

run()
