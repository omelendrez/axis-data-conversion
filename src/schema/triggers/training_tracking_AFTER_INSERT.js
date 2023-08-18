module.exports.query = `CREATE TRIGGER tracking_AFTER_INSERT AFTER INSERT ON training_tracking FOR EACH ROW BEGIN

DECLARE NEW_STATUS TINYINT;

SELECT
  MAX(status)
INTO
  NEW_STATUS
FROM
  training_tracking
WHERE
  training = NEW.training;

UPDATE
  training
SET
  status = NEW_STATUS
WHERE
  id = NEW.training;

END`
