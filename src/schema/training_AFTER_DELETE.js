module.exports.query = `CREATE TRIGGER training_AFTER_DELETE
AFTER
    DELETE ON training FOR EACH ROW BEGIN DECLARE learners_count tinyint default 0;

DECLARE classroom_id INT default 0;

SELECT
    id INTO classroom_id
FROM
    class
WHERE
    course = OLD.course
    AND start = OLD.start;

SELECT
    COUNT(1) INTO learners_count
FROM
    training t
    INNER JOIN class c ON t.course = c.course
    AND t.start = c.start
WHERE
    c.id = classroom_id;

IF learners_count = 0 THEN
DELETE FROM
    class
WHERE
    id = classroom_id;

ELSE
UPDATE
    class
SET
    learners = learners_count
WHERE
    id = classroom_id;

END IF;

END
`
