module.exports.query = `CREATE TRIGGER tracking_AFTER_DELETE AFTER DELETE ON training_tracking FOR EACH ROW BEGIN

  DECLARE NEW_STATUS TINYINT;

  SELECT
    MAX(status)
  INTO
    NEW_STATUS
  FROM
    training_tracking
  WHERE
    training = OLD.training;

  UPDATE
    training
  SET
    status = CASE WHEN NEW_STATUS IS NULL THEN 0 ELSE NEW_STATUS END
  WHERE
    id = OLD.training;

END`
