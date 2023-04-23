require('dotenv').config()
const mysql = require('../mysql/mysql-connect')
const countries = require('../schema/countries.json')
const countryErrors = require('../schema/countryErrors.json')

const updateTrainees = () => {
  return new Promise(async (resolve, reject) => {
    console.log(
      'Creating trainee nationalities table with all matching and not matching records'
    )
    const mySql = await mysql.connect()
    const db = 'axis'
    await mySql.query(`USE ${db};`)
    const [res] = await mySql.query(
      'SELECT t.id, n.name, t.nationality FROM trainee t INNER JOIN nationality n ON t.nationality = n.code;'
    )
    await mySql.query('DROP TABLE IF EXISTS nationalities;')
    await mySql.query(
      'CREATE TABLE nationalities (trainee INT,nationality SMALLINT, old_nationality SMALLINT, PRIMARY KEY (trainee));'
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
    console.log(
      'Updating trainees, renaming and table nationality2 to nationality'
    )
    const mySql = await mysql.connect()
    const db = 'axis'
    await mySql.query(`USE ${db};`)
    await mySql.query(
      'UPDATE trainee t INNER JOIN nationalities n ON t.id = n.trainee SET t.nationality = n.nationality;'
    )
    await mySql.query('DROP TABLE IF EXISTS nationalities;')
    await mySql.query('DROP TABLE IF EXISTS nationality;')
    await mySql.query('RENAME TABLE nationality2 TO nationality;')
    await mySql.query(
      "UPDATE trainee SET state=(SELECT id FROM state WHERE name='- Foreigner -') WHERE nationality<>566;"
    )
    mySql.end()
    resolve()
  })
}

module.exports = {
  updateTrainees,
  createTable,
  convertData
}
