module.exports.query = `CREATE TRIGGER training_AFTER_INSERT
AFTER
INSERT
    ON training FOR EACH ROW BEGIN

DECLARE classroom_id INT default 0;

SELECT
    id INTO classroom_id
FROM
    classroom
WHERE
    course = NEW.course
    AND start = NEW.start;

IF classroom_id = 0 THEN
    INSERT INTO
        classroom (course, start)
    VALUES
        (NEW.course, NEW.start);

    SELECT
        LAST_INSERT_ID()
    INTO
        classroom_id;
END IF;

UPDATE
    classroom
SET
    learners = learners + 1
WHERE
    id = classroom_id;

    UPDATE
    training
SET
    classroom = classroom_id
WHERE
    id = NEW.id;

END
`
