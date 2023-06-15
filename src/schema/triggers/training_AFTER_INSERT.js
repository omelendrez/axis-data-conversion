module.exports.query = `CREATE TRIGGER training_AFTER_INSERT
AFTER
INSERT
    ON training FOR EACH ROW BEGIN DECLARE learners_count tinyint default 0;

DECLARE classroom_id INT default 0;

DECLARE class_records_found SMALLINT default 0;

SELECT
    COUNT(1) INTO class_records_found
FROM
    classroom
WHERE
    course = NEW.course
    AND start = NEW.start;

IF class_records_found = 0 THEN
INSERT INTO
    classroom (course, start, learners)
VALUES
    (NEW.course, NEW.start, 0);

END IF;

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

END
`
