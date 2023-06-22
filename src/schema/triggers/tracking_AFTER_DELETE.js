module.exports.query = `CREATE TRIGGER tracking_AFTER_DELETE AFTER DELETE ON tracking FOR EACH ROW BEGIN

  DECLARE NEW_STATUS SMALLINT;

  SELECT
    MAX(status)
  INTO
    NEW_STATUS
  FROM
    tracking
  WHERE
    training = OLD.training;

  UPDATE
    training
  SET
    status = NEW_STATUS
  WHERE
    id = OLD.training;

END`