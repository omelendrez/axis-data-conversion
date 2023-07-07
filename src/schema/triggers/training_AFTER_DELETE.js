module.exports.query = `CREATE TRIGGER training_AFTER_DELETE
AFTER
    DELETE ON training FOR EACH ROW BEGIN

DECLARE classroom_id INT default 0;

SELECT
    id INTO classroom_id
FROM
    classroom
WHERE
    course = OLD.course
    AND start = OLD.start;

UPDATE
    classroom
SET
    learners = learners - 1
WHERE
    id = classroom_id;

DELETE FROM
    classroom
WHERE
    learners < 1 AND id = classroom_id;

END
`
