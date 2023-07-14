module.exports.query = `CREATE TRIGGER training_BEFORE_DELETE
BEFORE
    DELETE ON training FOR EACH ROW BEGIN

UPDATE
    classroom
SET
    learners = learners - 1
WHERE
    id = OLD.classroom;

DELETE FROM
    classroom
WHERE
    learners < 1 AND id = OLD.classroom;

END
`
