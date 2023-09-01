module.exports.query = `CREATE TRIGGER tracking_AFTER_INSERT AFTER INSERT ON training_tracking FOR EACH ROW BEGIN

DECLARE v_training INT;
DECLARE v_year_start VARCHAR(2);
DECLARE v_year_born VARCHAR(2);
DECLARE v_number VARCHAR(12);

DECLARE v_cert_type TINYINT;

DECLARE v_certificate VARCHAR(100);

SET v_training = NEW.training;

SELECT DATE_FORMAT(t.start, '%y'), DATE_FORMAT(l.birth_date, '%y'), c.cert_type, t.certificate
INTO v_year_start, v_year_born, v_cert_type, v_certificate
FROM training t
INNER JOIN course c ON c.id = t.course
INNER JOIN learner l ON l.id = t.learner
WHERE t.id = v_training;

IF NEW.status = 7 AND v_cert_type <> 4
THEN

  SELECT MAX(number)+1
  INTO v_number
  FROM certificate;

  SELECT CONCAT('T', v_year_start, v_number, v_year_born)
  INTO v_certificate;

  UPDATE training
  SET certificate = v_certificate
  WHERE id = v_training;

  INSERT INTO certificate (training, number)
  VALUES (v_training, v_number);

END IF;

UPDATE
  training
SET
  status = NEW.status,
  certificate = v_certificate
WHERE
  id = NEW.training;

END`
