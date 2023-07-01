module.exports.query = `CREATE TRIGGER training_BEFORE_INSERT BEFORE INSERT ON training FOR EACH ROW BEGIN

DECLARE expiry TINYINT DEFAULT 0;

SELECT
	expiry_type
INTO
	expiry
FROM
	course
WHERE
	id = NEW.course;

IF expiry <> 2 THEN
	SET NEW.prev_expiry = NULL;
END IF;

END
`
