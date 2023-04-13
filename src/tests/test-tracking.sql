select
  t.id,
  t.course,
  c.name course_name,
  t.certificate,
  t.status current_status,
  s.state current_status_name,
  u.full_name user,
  k.status tracking_status,
  s2.state tracking_state_name,
  s2.status tracking_status_name,
  k.updated tracking_updated
from
  training t
  inner join tracking k on t.id = k.training
  inner join status s on t.status = s.id
  inner join status s2 on k.status = s2.id
  inner join course c on t.course = c.code
  inner join user u on k.user = u.id
where
  t.learner = 728418
  and t.course = 146
order by
  k.updated;
