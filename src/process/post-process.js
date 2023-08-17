require('dotenv').config()
const fs = require('fs')
const path = require('path')
const mysqlpool = require('../mysql/mysql-connect')
const countries = require('../schema/countries.json')
const countryErrors = require('../schema/countryErrors.json')
const { writePercent } = require('./../helpers')

const updateLearners = async () => {
  const mySql = await mysqlpool

  return new Promise(async (resolve, reject) => {
    console.log(
      '- Creating learner nationalities table with all matching and not matching records.'
    )

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

    resolve()
  })
}

const createTable = async () => {
  const mySql = await mysqlpool

  return new Promise(async (resolve, reject) => {
    console.log(
      '- Creating new table nationality2 with the ISO standard list of countries.'
    )

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

    resolve()
  })
}

const convertData = async () => {
  const mySql = await mysqlpool

  return new Promise(async (resolve, reject) => {
    console.log("- Split learner's first_name into first and middle names.")
    await mySql.query(
      "UPDATE learner SET middle_name = SUBSTRING_INDEX(first_name, ' ', -1) WHERE SUBSTRING_INDEX(first_name, ' ', 1) <> SUBSTRING_INDEX(first_name, ' ', -1);"
    )
    await mySql.query(
      "UPDATE learner SET first_name = SUBSTRING_INDEX(first_name, ' ', 1) WHERE SUBSTRING_INDEX(first_name, ' ', 1) <> SUBSTRING_INDEX(first_name, ' ', -1);"
    )

    console.log('- Set learner title.')

    await mySql.query(
      "UPDATE learner SET title = CASE WHEN sex = 'M' THEN 1 ELSE 2 END;"
    )

    console.log('- Update missing type in learners.')
    await mySql.query('UPDATE learner SET type="TRN" WHERE type="";')

    console.log(
      '- Update learners with new standard nationality table, drop old table and rename new one.'
    )
    await mySql.query(
      'UPDATE learner t INNER JOIN nationalities n ON t.id = n.learner SET t.nationality = n.nationality;'
    )
    await mySql.query('DROP TABLE IF EXISTS nationalities;')
    await mySql.query('DROP TABLE IF EXISTS nationality;')
    await mySql.query('RENAME TABLE nationality2 TO nationality;')
    await mySql.query(
      'ALTER TABLE nationality ADD INDEX nationality_code_idx (code ASC) VISIBLE;'
    )

    console.log('- Update state for foreigner learners.')
    await mySql.query(
      "UPDATE learner SET state=(SELECT id FROM state WHERE name='- Foreigner -') WHERE nationality<>566;"
    )

    console.log('- Update training table with course id instead of code.')
    await mySql.query(
      'UPDATE training t INNER JOIN course c ON t.course = c.code SET t.course = c.id;'
    )

    console.log('- Drop code field from course table.')
    await mySql.query('ALTER TABLE course DROP INDEX course_code_idx;')
    await mySql.query('ALTER TABLE course DROP COLUMN code;')

    console.log('- Set courses not to require expiry date when validity = 0')
    await mySql.query('UPDATE course SET expiry_type = 0 WHERE validity=0;')

    console.log('- Set FOET courses to require previous expiry date')
    await mySql.query(
      'UPDATE course SET expiry_type = 2 WHERE name like "%foet%";'
    )

    console.log('- Update learner table with company id instead of code.')
    await mySql.query(
      'UPDATE learner t INNER JOIN company c ON t.company = c.code SET t.company = c.id;'
    )

    console.log('- Drop code field from company table.')
    await mySql.query('ALTER TABLE company DROP INDEX company_code_idx;')
    await mySql.query('ALTER TABLE company DROP COLUMN code;')

    console.log(
      '- Set learner company to "2696 * UNDEFINED *" when company is null.'
    )
    await mySql.query(
      'UPDATE learner SET company = 2696 WHERE company IS NULL;'
    )

    console.log('- Change learner company field type from varchar to smallint.')
    await mySql.query(
      'ALTER TABLE learner CHANGE COLUMN company company SMALLINT NOT NULL;'
    )

    console.log('- Delete training records with wrong or empty course code.')
    await mySql.query(
      'DELETE FROM training WHERE course NOT IN (SELECT id FROM course);'
    )

    console.log('- Delete learner with no training records.')
    await mySql.query(
      'DELETE FROM learner WHERE id NOT IN (SELECT learner FROM training);'
    )

    console.log('- Delete contact info for missing learners.')
    await mySql.query(
      'DELETE FROM contact_info WHERE learner NOT IN (SELECT id FROM learner);'
    )

    console.log(
      "- Delete course description when it doesn't exists in course/description relationship."
    )
    await mySql.query(
      'DELETE FROM course_item WHERE id NOT IN (SELECT item FROM course_item_rel);'
    )

    console.log('- Delete orphan course/description relationship.')
    await mySql.query(
      'DELETE FROM course_item_rel WHERE item NOT IN (SELECT id FROM course_item);'
    )
    await mySql.query(
      'DELETE FROM course_item_rel WHERE course NOT IN (SELECT id FROM course);'
    )

    // TODO: Check actual date fields with Nigeria
    // console.log('- Update dates to GMT+3')
    // await mySql.query(
    //   'UPDATE opito t SET created = DATE_ADD(created, INTERVAL 3 HOUR);'
    // )
    // await mySql.query(
    //   'UPDATE training t SET start = DATE_ADD(start, INTERVAL 1 DAY), expiry = DATE_ADD(expiry, INTERVAL 1 DAY);'
    // )
    console.log('- Change training course field type from char to smallint.')
    await mySql.query(
      'ALTER TABLE training CHANGE COLUMN course course SMALLINT NOT NULL;'
    )

    console.log(
      '- Update training status, empty course end date and certificate issued date fields.'
    )
    await mySql.query(
      'UPDATE training t INNER JOIN course c ON c.id = t.course SET end=DATE_ADD(t.start, INTERVAL c.duration-1 DAY) WHERE end IS NULL;'
    )
    await mySql.query(
      'UPDATE training t SET status = (SELECT MAX(tr.status) FROM training_tracking tr WHERE tr.training = t.id);'
    )

    await mySql.query(
      'UPDATE training SET issued=DATE_ADD(end, INTERVAL 1 DAY);'
    )

    console.log('- Set opito_file in training records.')
    await mySql.query(
      "UPDATE training t INNER JOIN opito o ON t.id = o.id SET opito_file = LOWER(HEX(CAST(DATE_FORMAT(o.created, '%Y%m%d') AS UNSIGNED)));"
    )

    console.log('- Remove legacy opito table.')
    await mySql.query('DROP TABLE IF EXISTS opito;')

    console.log('- Create training medical table.')
    await mySql.query('DROP TABLE IF EXISTS training_medical;')
    await mySql.query(
      'CREATE TABLE training_medical (training INT, systolic SMALLINT, diastolic SMALLINT, PRIMARY KEY (training));'
    )

    console.log('- Update training finance status.')
    await mySql.query('UPDATE training SET finance_status=1;')

    console.log('- Create user/role relationship table.')
    await mySql.query('DROP TABLE IF EXISTS user_role')
    await mySql.query(
      'CREATE TABLE user_role (id INT NOT NULL AUTO_INCREMENT, user SMALLINT NOT NULL, role SMALLINT NOT NULL, PRIMARY KEY (id));'
    )

    console.log('- Create reject_reasons table.')
    await mySql.query('DROP TABLE IF EXISTS reject_reason;')
    await mySql.query(
      'CREATE TABLE reject_reason (id INT NOT NULL AUTO_INCREMENT, tracking INT NOT NULL, reason VARCHAR(255), PRIMARY KEY (id));'
    )

    console.log('- Adding foreign keys to tables.')

    console.log(' . training')
    await mySql.query(
      `ALTER TABLE training
      ADD FOREIGN KEY(learner) REFERENCES learner(id),
      ADD FOREIGN KEY(course) REFERENCES course(id),
      ADD FOREIGN KEY(status) REFERENCES status(id);`
    )

    console.log(' . training_medical')
    await mySql.query(
      `ALTER TABLE training_medical
      ADD FOREIGN KEY(training) REFERENCES training(id);`
    )

    console.log(' . training_tracking set user 1 for user 0')
    await mySql.query('UPDATE training_tracking SET user = 1 WHERE user = 0;')

    console.log(' . training_tracking delete not in training')
    await mySql.query(
      'DELETE FROM training_tracking WHERE training NOT IN (SELECT id FROM training);'
    )

    console.log(' . training_tracking delete not in user')
    await mySql.query(
      'DELETE FROM training_tracking WHERE user NOT IN (SELECT id FROM user);'
    )

    await mySql.query(
      `ALTER TABLE training_tracking
      ADD FOREIGN KEY(user) REFERENCES user(id),
      ADD FOREIGN KEY(status) REFERENCES status(id),
      ADD FOREIGN KEY(training) REFERENCES training(id);`
    )

    console.log(' . reject_reason')
    await mySql.query(
      `ALTER TABLE reject_reason
      ADD FOREIGN KEY(tracking) REFERENCES training_tracking(id);`
    )

    console.log(' . contact_info')
    await mySql.query(
      `ALTER TABLE contact_info
      ADD FOREIGN KEY(learner) REFERENCES learner(id),
      ADD FOREIGN KEY(type) REFERENCES contact_type(id);`
    )

    console.log(' . course')
    await mySql.query(
      `ALTER TABLE course
      ADD FOREIGN KEY(cert_type) REFERENCES certificate_type(id);`
    )

    console.log(' . course_item_rel')
    await mySql.query(
      `ALTER TABLE course_item_rel
      ADD FOREIGN KEY(course) REFERENCES course(id),
      ADD FOREIGN KEY(item) REFERENCES course_item(id);`
    )

    console.log(' . learner')
    await mySql.query(`UPDATE learner SET sex = 'M' WHERE sex = '';`)

    await mySql.query(
      `ALTER TABLE learner
      ADD FOREIGN KEY(title) REFERENCES title(id),
      ADD FOREIGN KEY(sex) REFERENCES sex(id),
      ADD FOREIGN KEY(state) REFERENCES state(id),
      ADD FOREIGN KEY(nationality) REFERENCES nationality(id),
      ADD FOREIGN KEY(company) REFERENCES company(id);
      `
    )

    console.log(' . certificate')
    await mySql.query(
      `DELETE FROM certificate
       WHERE training NOT IN (SELECT id FROM training);`
    )

    await mySql.query(
      `ALTER TABLE certificate
      ADD FOREIGN KEY(training) REFERENCES training(id);`
    )

    console.log(' . user_role')
    await mySql.query(
      `ALTER TABLE user_role
      ADD FOREIGN KEY(user) REFERENCES user(id),
      ADD FOREIGN KEY(role) REFERENCES role(id);`
    )

    console.log(' . creating tiggers')

    const query2 = 'SELECT COUNT(1) records FROM training_attendance;'
    const [res2] = await mySql.query(query2)

    const totalTrainingAttendanceRecords = res2[0].records

    const triggersPath = path.join(__dirname, '..', 'schema', 'triggers')

    await fs.readdirSync(triggersPath).map(async (fileName) => {
      const fullPath = path.join(triggersPath, fileName)
      const file = await require(fullPath)

      const displayTrigger = fileName.split('.')[0].split('_').join(' ')

      console.log(` . ${displayTrigger}`)

      const query = file?.query
      if (query) {
        await mySql.query(query)
      } else {
        console.log(`Couldn't load file ${fullPath}`)
      }
    })

    console.log('- Update dev email address.')
    const oldDomain = 'escng'
    const newDomain = 'gmail'
    await mySql.query(
      `UPDATE user SET email=REPLACE(email,'${oldDomain}','${newDomain}') WHERE email LIKE '%${oldDomain}%';`
    )

    console.log('- Add role to Ndubuisi and Omar.')

    await mySql.query(
      'INSERT INTO user_role (user, role) VALUES (95,1), (1023,1);'
    )

    resolve()
  })
}

module.exports = {
  updateLearners,
  createTable,
  convertData
}
