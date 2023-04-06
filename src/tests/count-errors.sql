SELECT 'persons without any training' 'Issue' ,COUNT(1) 'Records affected'
FROM tblPersonnel
WHERE ID NOT IN
    (SELECT EmpID
    FROM empTraining )

UNION

SELECT 'persons that are subcontractors' ,COUNT(1)
FROM tblPersonnel
WHERE pertype = 'SUB'

UNION

SELECT 'training records with wrong course code' ,COUNT (1)
FROM empTraining
WHERE CourseCode NOT IN
    (SELECT CourseCode
    FROM tblHSECourses )

UNION

SELECT 'persons affected by training records with wrong course code' ,COUNT (1)
FROM tblPersonnel
WHERE ID IN
    (SELECT EmpID
    FROM empTraining
    WHERE CourseCode NOT IN
        (SELECT CourseCode
        FROM tblHSECourses ) )
UNION

SELECT 'persons without client (0000 *UNDEFINED*)' ,COUNT(1)
FROM tblPersonnel
WHERE agencode = '0000'

UNION

SELECT 'persons without job title (000000 PENDING)' ,COUNT(1)
FROM tblPersonnel
WHERE posicode = '000000'

SELECT firstname, surname, bdate, COUNT(1) 'Records found'
FROM tblPersonnel
WHERE Active = 1
GROUP BY firstname, surname, bdate
HAVING COUNT(1) > 1
ORDER BY COUNT(1) DESC

SELECT Certificate, COUNT(1) 'Records found'
FROM empTraining
WHERE CourseCode IN
    (SELECT CourseCode
    FROM tblHSECourses)
AND Certificate <> ''
GROUP BY Certificate
HAVING COUNT(1) > 1
ORDER BY COUNT(1) DESC
