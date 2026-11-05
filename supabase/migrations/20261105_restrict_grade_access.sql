-- Restrict student access to own submissions while their enrollment remains active.
alter policy "Ver únicamente entregas propias o del curso asignado" on public.assignment_submissions
using (
  (
    user_id=(select auth.uid())
    and exists (
      select 1 from public.course_assignments a
      join public.course_enrollments e on e.course_id=a.course_id
      where a.id=assignment_submissions.assignment_id
        and a.published and e.user_id=(select auth.uid()) and e.status='active'
    )
  )
  or exists (
    select 1 from public.course_assignments a
    join public.academic_courses c on c.id=a.course_id
    join public.student_profiles p on p.id=(select auth.uid())
    where a.id=assignment_submissions.assignment_id
      and (p.role='admin' or (p.role='teacher' and c.teacher_id=(select auth.uid())))
  )
);
