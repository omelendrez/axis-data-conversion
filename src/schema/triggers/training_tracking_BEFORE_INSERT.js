module.exports.query = `CREATE TRIGGER tracking_BEFORE_INSERT BEFORE INSERT ON training_tracking FOR EACH ROW BEGIN
DECLARE from_date DATE;
DECLARE	to_date DATE;
DECLARE cur_date DATE;
DECLARE training_id INT;

SET training_id = NEW.training;

IF NEW.status = 4 THEN

    SELECT
        start, end
    INTO
        from_date, to_date
    FROM
        training
    WHERE
        id = NEW.training;

    SET
        cur_date = from_date;

  WHILE cur_date <= to_date DO
    INSERT INTO
        training_attendance (training, date, signature_file)
    VALUES
        (training_id, cur_date, '');

  SET
    cur_date = DATE_ADD(cur_date, INTERVAL 1 DAY);

  END WHILE;

END IF;
END`
