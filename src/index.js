require('dotenv').config()
const schemas = require('./schema/schemas.json')
const filler = require('./schema/post-data-conversion-data.json')

const data = require('./process/data-conversion')
const post = require('./process/post-data-conversion')

async function run() {
  try {
    console.log()
    console.log('AXIS DATA CONVERSION: Starting')
    console.log()

    let totalRecords = 0
    let processed = 0
    let tables = 0
    let updatedRecords = 0

    await Promise.all(
      schemas
        .filter((t) => !t.isDone)
        .map(async (t) => {
          const [read, inserted] = await data.convert(t)
          totalRecords += read
          processed += inserted
          tables++
        })
    )

    await Promise.all(
      filler
        .filter((t) => !t.isDone && t.isSecure)
        .map(async (t) => {
          const [updated] = await post.secureUserPasswords(t)
          processed += updated
          tables++
        })
    )

    await Promise.all(
      filler
        .filter((t) => !t.isDone && t.isInsert)
        .map(async (t) => {
          const [read, inserted] = await post.addTracking(t)
          totalRecords += read
          processed += inserted
        })
    )

    await Promise.all(
      filler
        .filter((t) => !t.isDone && !t.isUpdate && !t.isInsert && !t.isSecure)
        .map(async (t) => {
          const [inserted] = await post.execute(t)
          processed += inserted
          tables++
        })
    )

    await Promise.all(
      filler
        .filter((t) => !t.isDone && t.isUpdate)
        .map(async (t) => {
          const [inserted] = await post.executeProcedure(t)
          processed += inserted
        })
    )

    console.log('Total tables processed:', tables)
    console.log('Total records read from MSSQL:', totalRecords)
    console.log('Total records inserted to MySQL:', processed)
    console.log('Total records updated MySQL:', updatedRecords)
    console.log()
    console.log('AXIS DATA CONVERSION: Completed')

    setTimeout(() => process.exit(), 1000)

  } catch (err) {
    console.dir(err)
    setTimeout(() => process.exit(), 1000)
  }
}

process.stdin.setRawMode(true)
process.stdin.resume()
process.stdin.on('data', process.exit.bind(process, 0))

run()
