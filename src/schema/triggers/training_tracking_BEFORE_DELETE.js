module.exports.query = `CREATE TRIGGER tracking_BEFORE_DELETE
BEFORE
  DELETE ON training_tracking FOR EACH ROW BEGIN

	DECLARE training_id INT;

  DECLARE training_status TINYINT;

  DECLARE fromDate DATE;
  DECLARE	toDate DATE;
  DECLARE curDate DATE;

  SELECT
    OLD.training, OLD.status
  INTO
    training_id, training_status;

  IF training_status = 4 THEN
    DELETE FROM
      training_medical
    WHERE
      training = training_id;
  END IF;

  IF training_status = 5 THEN
    DELETE FROM
      training_attendance
    WHERE
      training = training_id;
  END IF;

  IF training_status = 6 THEN
    DELETE FROM
      training_assessment
    WHERE
      training = training_id;
  END IF;

  IF training_status IN (4,5,6,7,8) THEN
    UPDATE
      training
    SET
      finance_status = null
    WHERE
      id = training_id;
  END IF;

END`
