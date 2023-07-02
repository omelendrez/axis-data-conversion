module.exports.query = `CREATE TRIGGER learner_BEFORE_INSERT BEFORE INSERT ON learner FOR EACH ROW BEGIN
	DECLARE last_badge VARCHAR(255) DEFAULT '';
    DECLARE new_badge INT DEFAULT 0;
    DECLARE prefix VARCHAR(2) DEFAULT '';

    IF NEW.type = 'TRN' THEN
		SET prefix = 'TR';
	END IF;

	SELECT
        REGEXP_REPLACE(MAX(badge), '[a-zA-Z]+', '')
    INTO
        last_badge
    FROM
        learner
    WHERE
        type=NEW.type;

    SET new_badge = CAST(last_badge AS UNSIGNED) + 1;
    SET NEW.badge = CONCAT(prefix, REGEXP_REPLACE(CAST(new_badge AS CHAR(10)),' ',''));

    SET NEW.last_name = UPPER(TRIM(NEW.last_name));
    SET NEW.middle_name = UPPER(TRIM(NEW.middle_name));
    SET NEW.first_name = UPPER(TRIM(NEW.first_name));
END`
