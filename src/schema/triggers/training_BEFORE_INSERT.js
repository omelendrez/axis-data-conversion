module.exports.query = `CREATE TRIGGER training_BEFORE_INSERT BEFORE INSERT ON training FOR EACH ROW BEGIN
	DECLARE v_start DATE;
    DECLARE v_end DATE;
    DECLARE v_issued DATE;
    DECLARE v_expiry DATE;

    DECLARE v_duration TINYINT;
    DECLARE v_validity TINYINT;

    DECLARE v_expiry_type TINYINT;

    SET v_start = NEW.start;
    SET v_expiry = NEW.expiry;

    SELECT duration, validity, expiry_type
    INTO v_duration, v_validity, v_expiry_type
    FROM course
    WHERE id = NEW.course;

    SET v_issued = DATE_ADD(v_start, INTERVAL v_duration DAY);
    SET v_end = DATE_ADD(v_issued, INTERVAL -1 DAY);

    IF v_expiry_type = 0 -- No expiration date
    THEN
        SET v_expiry = NULL;
    END IF;

    IF v_expiry_type = 1 -- Automatic
    THEN
        SET v_expiry = DATE_ADD(DATE_ADD(v_issued, INTERVAL v_validity YEAR), INTERVAL -1 DAY);
    END IF;

    SET NEW.end = v_end;
    SET NEW.issued = v_issued;
    SET NEW.expiry = v_expiry;

END`
