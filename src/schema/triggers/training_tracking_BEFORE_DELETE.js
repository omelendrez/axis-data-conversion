module.exports.query = `CREATE TRIGGER tracking_BEFORE_DELETE
BEFORE
  DELETE ON training_tracking FOR EACH ROW BEGIN

	DECLARE v_training_id INT;
  DECLARE v_training_status TINYINT;
  DECLARE v_cert_type TINYINT;

  SELECT
    OLD.training, OLD.status
  INTO
    v_training_id, v_training_status;

  IF v_training_status = 4 THEN -- MEDIC_DONE
    DELETE FROM
      training_medical
    WHERE
      training = v_training_id;
  END IF;

  IF v_training_status = 7 THEN -- QA_DONE
    SELECT
      cert_type
    INTO
      v_cert_type
    FROM
      course
    WHERE
      id = (SELECT
              course
            FROM
              training
            WHERE
              id = v_training_id
            );

    IF v_cert_type <> 4 THEN -- OPITO
      DELETE FROM
        certificate
      WHERE
        training = v_training_id;

      UPDATE
        training
      SET
        certificate = ''
      WHERE
        id = v_training_id;

    END IF;

  END IF;

END`
