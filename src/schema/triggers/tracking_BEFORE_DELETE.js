module.exports.query = `CREATE TRIGGER tracking_BEFORE_DELETE
BEFORE
  DELETE ON tracking FOR EACH ROW BEGIN

	DECLARE training_id INT;

  DECLARE training_status TINYINT;

  SELECT
    training, status
  INTO
    training_id, training_status
  FROM
    OLD;

  IF training_status = 3 THEN
    DELETE FROM
      training_medical
    WHERE
      training = training_id;
  END IF;

  IF training_status = 5 THEN
    DELETE FROM
      training_assesment
    WHERE
      training = training_id;
  END IF;

  IF training_status = 7 THEN
    UPDATE
      training
    SET
      finance_status = null
    WHERE
      id = training_id;
  END IF;
END`
