module.exports.query = `CREATE TRIGGER tracking_AFTER_DELETE AFTER DELETE ON training_tracking FOR EACH ROW BEGIN

  DECLARE v_new_status TINYINT;

  SELECT
    MAX(status)
  INTO
    v_new_status
  FROM
    training_tracking
  WHERE
    training = OLD.training;

  UPDATE
    training
  SET
    status = CASE WHEN v_new_status IS NULL THEN 0 ELSE v_new_status END
  WHERE
    id = OLD.training;

END`
