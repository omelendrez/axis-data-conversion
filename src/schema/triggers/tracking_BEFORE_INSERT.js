module.exports.query = `CREATE TRIGGER tracking_BEFORE_INSERT BEFORE INSERT ON tracking FOR EACH ROW BEGIN
DECLARE fromDate DATE;
DECLARE	toDate DATE;
DECLARE curDate DATE;
DECLARE fileName VARCHAR(12);
DECLARE training INT;

SET training = NEW.training;

IF NEW.status = 4 THEN

    SELECT start, end
    INTO fromDate, toDate
    FROM training
    WHERE id = NEW.training;

    SET curDate = fromDate;

    WHILE curDate <= toDate DO
        SET fileName = LOWER(CONCAT(HEX(CAST(DATE_FORMAT(curDate, '%Y%m%d') as UNSIGNED)),'.pdf'));

        IF NOT EXISTS (SELECT 1 FROM training_attendance WHERE training = training AND date = curDate) THEN
            INSERT INTO training_attendance (training, date, signature_file) VALUES (training, curDate, fileName);
        END IF;

        SET curDate = DATE_ADD(curDate, INTERVAL 1 DAY);
    END WHILE;

END IF;
END`
