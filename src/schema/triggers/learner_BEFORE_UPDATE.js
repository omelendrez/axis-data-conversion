module.exports.query = `CREATE TRIGGER learner_BEFORE_UPDATE BEFORE UPDATE ON learner FOR EACH ROW BEGIN
    SET NEW.last_name = UPPER(NEW.last_name);
    SET NEW.first_name = UPPER(NEW.first_name);
END`
