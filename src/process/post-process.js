require('dotenv').config()
const mysql = require('../mysql/mysql-connect')
const countries = require('../schema/countries.json')
const countryErrors = require('../schema/countryErrors.json')
const training_trigger_insert = require('../schema/training_AFTER_INSERT')
const training_trigger_update = require('../schema/training_AFTER_UPDATE')
const training_trigger_delete = require('../schema/training_AFTER_DELETE')
const learner_before_insert = require('../schema/learner_BEFORE_INSERT')
const learner_before_update = require('../schema/learner_BEFORE_UPDATE.js')

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
      'Creating new table nationality2 with the ISO standard list of countries'
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

    console.log('Update missing type in learners')
    await mySql.query('UPDATE learner SET type="TRN" WHERE type="";')

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

    console.log('Delete learner with no training records.')
    await mySql.query(
      'DELETE FROM learner WHERE id NOT IN (SELECT learner FROM training);'
    )

    console.log('Delete contact info for missing learners.')
    await mySql.query(
      'DELETE FROM contact_info WHERE learner NOT IN (SELECT id FROM learner);'
    )

    console.log(
      "Delete course description when it doesn't exists in course/description relationship."
    )
    await mySql.query(
      'DELETE FROM course_item WHERE id NOT IN (SELECT item FROM course_item_rel);'
    )

    console.log('Delete orphan course/description relationship.')
    await mySql.query(
      'DELETE FROM course_item_rel WHERE item NOT IN (SELECT id FROM course_item);'
    )

    await mySql.query(
      'DELETE FROM course_item_rel WHERE course NOT IN (SELECT id FROM course);'
    )

    console.log('Create tracking records')

    await mySql.query(
      'UPDATE training t INNER JOIN tracking t2 on t2.training=t.id SET t.status=t2.status;'
    )

    await mySql.query('UPDATE training SET status=10 WHERE certificate<>""')

    console.log('Create class table')
    await mySql.query('DROP TABLE IF EXISTS class;')
    await mySql.query(
      'CREATE TABLE class (id INT NOT NULL AUTO_INCREMENT,course SMALLINT NOT NULL,start DATE NOT NULL,learners TINYINT,PRIMARY KEY (id));'
    )

    console.log('Generate class table records')
    await mySql.query(
      'INSERT INTO class (course, start, learners) SELECT course, start, count(1) FROM training GROUP BY course,start ORDER BY start; '
    )

    console.log('Create training tiggers')

    await mySql.query(training_trigger_insert.query)
    await mySql.query(training_trigger_update.query)
    await mySql.query(training_trigger_delete.query)

    console.log('Create learner tiggers')

    await mySql.query(learner_before_insert.query)
    await mySql.query(learner_before_update.query)

    console.log('Create assesments table')

    await mySql.query('DROP TABLE IF EXISTS course_assesment;')
    await mySql.query(
      'CREATE TABLE course_assesment (id SMALLINT NOT NULL AUTO_INCREMENT, name VARCHAR(60), PRIMARY KEY (id));'
    )

    console.log('Create course/assesments relationship table')

    mySql.query('DROP TABLE IF EXISTS course_assesment_rel;')
    mySql.query(
      'CREATE TABLE course_assesment_rel (id INT NOT NULL AUTO_INCREMENT, course SMALLINT, assesment SMALLINT, PRIMARY KEY (id));'
    )

    console.log('Create user/role relationship table')

    mySql.query('DROP TABLE IF EXISTS user_role;')
    mySql.query(
      'CREATE TABLE user_role (id INT NOT NULL AUTO_INCREMENT, user SMALLINT, role SMALLINT, PRIMARY KEY (id));'
    )

    console.log('Update dev email address')

    mySql.query(
      'UPDATE user SET email=REPLACE(email,"escng","gmail") WHERE email LIKE "%escng%";'
    )

    console.log('Add role to Ndubuisi and Omar')

    mySql.query('INSERT INTO user_role (user, role) VALUES (95,1), (1023,1);')

    mySql.end()
    resolve()
  })
}

module.exports = {
  updateLearners,
  createTable,
  convertData
}
