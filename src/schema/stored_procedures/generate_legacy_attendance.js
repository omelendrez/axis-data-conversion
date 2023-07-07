module.exports.query = `DROP PROCEDURE IF EXISTS generate_legacy_attendance;CREATE PROCEDURE generate_legacy_attendance(IN last_training_id INT) BEGIN

DECLARE done INT DEFAULT FALSE;

DECLARE training_id INT;

DECLARE from_date DATE;

DECLARE to_date DATE;

DECLARE cur_date DATE;

DECLARE training_cursor CURSOR FOR
SELECT
  id,
  start,
  end
FROM
  training
WHERE
  id > last_training_id
LIMIT 100;

DECLARE CONTINUE HANDLER FOR NOT FOUND
SET
  done = TRUE;

IF last_training_id = 0 THEN
DELETE FROM
  training_attendance
WHERE
  training > 0;

END IF;

OPEN training_cursor;

read_loop: LOOP FETCH training_cursor INTO training_id,
from_date,
to_date;

IF done THEN LEAVE read_loop;

END IF;

SET
  cur_date = from_date;

WHILE cur_date <= to_date DO
INSERT INTO
  training_attendance (training, date)
VALUES
  (training_id, cur_date);

SET
  cur_date = DATE_ADD(cur_date, INTERVAL 1 DAY);

END WHILE;

END LOOP;

CLOSE training_cursor;

SELECT
  training_id;

END`
