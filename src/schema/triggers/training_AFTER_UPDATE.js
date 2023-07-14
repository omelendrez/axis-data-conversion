module.exports.query = `CREATE TRIGGER training_AFTER_UPDATE
AFTER
UPDATE
	ON training FOR EACH ROW BEGIN

DECLARE learners_count SMALLINT default 0;

DECLARE classroom_id INT default 0;

DECLARE classroom_records_count SMALLINT default 0;

IF NEW.course <> OLD.course OR NEW.start <> OLD.start THEN

	SELECT
		COUNT(1) INTO classroom_records_count
	FROM
		classroom
	WHERE
		course = NEW.course
	AND start = NEW.start;

	IF classroom_records_count = 0 THEN
		INSERT INTO
			classroom (course, start, learners)
		VALUES
			(NEW.course, NEW.start, 0);
	END IF;

	-- New data
	SELECT
		id INTO classroom_id
	FROM
		classroom
	WHERE
		course = NEW.course
		AND start = NEW.start;

	SELECT
		COUNT(1) INTO learners_count
	FROM
		training t
		INNER JOIN classroom c ON t.course = c.course
		AND t.start = c.start
	WHERE
		c.id = classroom_id;

	UPDATE
		classroom
	SET
		learners = learners_count
	WHERE
		id = classroom_id;

	-- Old data
	SELECT
		id INTO classroom_id
	FROM
		classroom
	WHERE
		course = OLD.course
		AND start = OLD.start;

	SELECT
		COUNT(1) INTO learners_count
	FROM
		training t
		INNER JOIN classroom c ON t.course = c.course
		AND t.start = c.start
	WHERE
		c.id = classroom_id;

	IF learners_count = 0 THEN
		DELETE FROM
			classroom
		WHERE
			id = classroom_id;
	ELSE
		UPDATE
			classroom
		SET
			learners = learners_count
		WHERE
			id = classroom_id;
	END IF;

	UPDATE
    training
	SET
			classroom = classroom_id
	WHERE
			id = NEW.id;

END IF;

END
`
