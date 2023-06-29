module.exports.query = `CREATE TRIGGER learner_BEFORE_UPDATE BEFORE UPDATE ON learner FOR EACH ROW BEGIN
    SET NEW.last_name = capitalize(NEW.last_name);
    SET NEW.middle_name = capitalize(NEW.middle_name);
    SET NEW.first_name = capitalize(NEW.first_name);
END`
