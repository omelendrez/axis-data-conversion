require('dotenv').config()
const mysql = require('../mysql/mysql-connect')
const countries = require('../schema/countries.json')
const countryErrors = require('../schema/countryErrors.json')

const updateLearners = () => {
  return new Promise(async (resolve, reject) => {
    console.log(
      'Creating learner nationalities table with all matching and not matching records'
    )
    const mySql = await mysql.connect()
    const db = 'axis'
    await mySql.query(`USE ${db};`)
    const [res] = await mySql.query(
      'SELECT t.id, n.name, t.nationality FROM learner t INNER JOIN nationality n ON t.nationality = n.code;'
    )
    await mySql.query('DROP TABLE IF EXISTS nationalities;')
    await mySql.query(
      'CREATE TABLE nationalities (learner INT,nationality SMALLINT, old_nationality SMALLINT, PRIMARY KEY (learner));'
    )

    const allCountries = [...countries, ...countryErrors]

    const records = res.map((t) => {
      const row = []
      const country = allCountries.find((n) =>
        n.nationality.toLocaleLowerCase().includes(t.name.toLowerCase())
      )
      if (country) {
        row.push(t.id, country.num_code, t.nationality)
        return row
      }
      row.push(t.id, 0, t.nationality)
      return row
    })

    await mySql.query('INSERT INTO nationalities VALUES ?', [records])
    await mySql.end()
    resolve()
  })
}

const createTable = () => {
  return new Promise(async (resolve, reject) => {
    console.log(
      'Creating new table nationality2 with the new standard list of countries'
    )
    const mySql = await mysql.connect()
    const db = 'axis'
    await mySql.query(`USE ${db};`)
    await mySql.query('DROP TABLE IF EXISTS nationality2;')
    await mySql.query(
      'CREATE TABLE nationality2 (id SMALLINT NOT NULL AUTO_INCREMENT,code CHAR(3), country VARCHAR(100), nationality VARCHAR(100) NOT NULL, PRIMARY KEY (id));'
    )
    const records = countries.map((n) => {
      const row = []
      row.push(n.num_code, n.alpha_3_code, n.en_short_name, n.nationality)
      return row
    })

    await mySql.query('INSERT INTO nationality2 VALUES ?', [records])
    await mySql.end()
    resolve()
  })
}

const convertData = () => {
  return new Promise(async (resolve, reject) => {
    const mySql = await mysql.connect()
    const db = 'axis'
    await mySql.query(`USE ${db};`)
    console.log(
      'Update learners with new standard nationality table, drop old table and rename new one.'
    )
    await mySql.query(
      'UPDATE learner t INNER JOIN nationalities n ON t.id = n.learner SET t.nationality = n.nationality;'
    )
    await mySql.query('DROP TABLE IF EXISTS nationalities;')
    await mySql.query('DROP TABLE IF EXISTS nationality;')
    await mySql.query('RENAME TABLE nationality2 TO nationality;')

    console.log('Update state for foreigner learners.')
    await mySql.query(
      "UPDATE learner SET state=(SELECT id FROM state WHERE name='- Foreigner -') WHERE nationality<>566;"
    )

    console.log('Update training table with course id instead of code.')
    await mySql.query(
      'UPDATE training t INNER JOIN course c ON t.course = c.code SET t.course = c.id;'
    )

    console.log('Drop code field from course table.')
    await mySql.query('ALTER TABLE course DROP INDEX course_code_idx;')
    await mySql.query('ALTER TABLE course DROP COLUMN code;')

    console.log('Update learner table with company id instead of code.')
    await mySql.query(
      'UPDATE learner t INNER JOIN company c ON t.company = c.code SET t.company = c.id;'
    )

    console.log('Drop code field from company table.')
    await mySql.query('ALTER TABLE company DROP INDEX company_code_idx;')
    await mySql.query('ALTER TABLE company DROP COLUMN code;')

    console.log('Delete training records with wrong or empty course code.')
    await mySql.query(
      'DELETE FROM training WHERE course NOT IN (SELECT id FROM course);'
    )

    console.log('Delete learner with no training.')
    await mySql.query(
      'DELETE FROM learner WHERE id NOT IN (SELECT learner FROM training);'
    )

    mySql.end()
    resolve()
  })
}

module.exports = {
  updateLearners,
  createTable,
  convertData
}
