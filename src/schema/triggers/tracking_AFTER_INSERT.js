module.exports.query = `CREATE TRIGGER tracking_AFTER_INSERT AFTER INSERT ON tracking FOR EACH ROW BEGIN

  UPDATE
    training
  SET
    status = NEW.status
  WHERE
    id = NEW.training;

END`
