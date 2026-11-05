-- Hospital Virtual ULEAM · panel docente, actividades y calificaciones
-- Migración aditiva; no cambia las matrículas ni los cursos existentes.

create table if not exists public.course_assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.academic_courses(id) on delete cascade,
  title text not null check (length(btrim(title)) between 5 and 160),
  instructions text not null check (length(btrim(instructions)) between 10 and 8000),
  kind text not null check (kind in ('actividad', 'evaluacion')),
  max_score numeric(5,2) not null default 10 check(max_score > 0 and max_score <= 100),
  due_at timestamptz,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists course_assignments_course_idx on public.course_assignments(course_id);
alter table public.course_assignments enable row level security;
revoke all on public.course_assignments from anon;
grant select, insert on public.course_assignments to authenticated;

create policy "Tareas visibles solo para estudiantes matriculados o docente" on public.course_assignments
for select to authenticated using (
  (published and exists (
     select 1 from public.course_enrollments e
     where e.course_id=course_assignments.course_id and e.user_id=(select auth.uid()) and e.status='active'
  ))
  or exists (
    select 1 from public.academic_courses c
    join public.student_profiles p on p.id=(select auth.uid())
    where c.id=course_assignments.course_id
      and (p.role='admin' or (p.role='teacher' and c.teacher_id=(select auth.uid())))
  )
);
create policy "Solo docente autorizado crea actividades" on public.course_assignments
for insert to authenticated with check (
  exists (
    select 1 from public.academic_courses c
    join public.student_profiles p on p.id=(select auth.uid())
    where c.id=course_assignments.course_id
      and (p.role='admin' or (p.role='teacher' and c.teacher_id=(select auth.uid())))
  )
);

create table if not exists public.assignment_submissions (
  assignment_id uuid not null references public.course_assignments(id) on delete cascade,
  user_id uuid not null references public.student_profiles(id) on delete cascade,
  answer_text text not null check(length(btrim(answer_text)) between 10 and 8000),
  submitted_at timestamptz not null default now(),
  score numeric(5,2),
  feedback text not null default '',
  graded_by uuid references public.student_profiles(id) on delete set null,
  graded_at timestamptz,
  primary key(assignment_id, user_id),
  constraint valid_score_nonnegative check(score is null or score >= 0)
);
create index if not exists assignment_submissions_user_idx on public.assignment_submissions(user_id);
alter table public.assignment_submissions enable row level security;
revoke all on public.assignment_submissions from anon, authenticated;
grant select on public.assignment_submissions to authenticated;

create policy "Ver únicamente entregas propias o del curso asignado" on public.assignment_submissions
for select to authenticated using (
 user_id=(select auth.uid())
 or exists (
   select 1 from public.course_assignments a
   join public.academic_courses c on c.id=a.course_id
   join public.student_profiles p on p.id=(select auth.uid())
   where a.id=assignment_submissions.assignment_id
     and (p.role='admin' or (p.role='teacher' and c.teacher_id=(select auth.uid())))
 )
);

-- Estas funciones de API deben ser definer para acceder de forma controlada a
-- perfiles de estudiantes y realizar mutaciones sin conceder INSERT/UPDATE
-- directamente al navegador. Todas verifican auth.uid y permisos de curso.
create or replace function public.get_course_roster(p_course_id uuid)
returns table (
 user_id uuid,
 full_name text,
 enrolled_at timestamptz,
 studied_count bigint,
 status text
)
language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null or not exists (
   select 1 from public.academic_courses c
   join public.student_profiles p on p.id=auth.uid()
   where c.id=p_course_id
     and (p.role='admin' or (p.role='teacher' and c.teacher_id=auth.uid()))
 ) then
   raise exception 'No autorizado a ver las matrículas del curso';
 end if;
 return query
 select e.user_id, p.full_name, e.enrolled_at,
   (select count(*) from public.bone_study_progress b
    where b.user_id=e.user_id and b.course_id=e.course_id) as studied_count,
   e.status
 from public.course_enrollments e
 join public.student_profiles p on p.id=e.user_id
 where e.course_id=p_course_id
 order by p.full_name asc;
end; $$;

create or replace function public.submit_course_assignment(p_assignment_id uuid, p_answer text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_course uuid;
begin
  if v_user is null then raise exception 'Inicia sesión para entregar'; end if;
  if p_answer is null or length(btrim(p_answer)) < 10 or length(btrim(p_answer)) > 8000 then
    raise exception 'La respuesta debe tener entre 10 y 8000 caracteres';
  end if;
  select a.course_id into v_course
  from public.course_assignments a
  where a.id=p_assignment_id and a.published
    and (a.due_at is null or a.due_at >= now());
  if v_course is null or not exists (
     select 1 from public.course_enrollments e
     where e.user_id=v_user and e.course_id=v_course and e.status='active'
  ) then
    raise exception 'No puedes entregar esta actividad: matrícula o plazo no válido';
  end if;

  insert into public.assignment_submissions (assignment_id,user_id,answer_text)
  values(p_assignment_id,v_user,btrim(p_answer))
  on conflict (assignment_id,user_id)
  do update set answer_text=excluded.answer_text, submitted_at=now()
  where public.assignment_submissions.graded_at is null;

  if not found then
    raise exception 'Ya fue calificada: no se puede reemplazar la entrega';
  end if;
  return jsonb_build_object('ok',true,'message','Respuesta entregada correctamente');
end; $$;

create or replace function public.grade_course_submission(
  p_assignment_id uuid,
  p_student_id uuid,
  p_score numeric,
  p_feedback text default ''
)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
 v_max numeric;
 v_teacher uuid := auth.uid();
begin
 if v_teacher is null then raise exception 'Inicia sesión para calificar'; end if;
 select a.max_score into v_max
 from public.course_assignments a
 join public.academic_courses c on c.id=a.course_id
 join public.student_profiles p on p.id=v_teacher
 where a.id=p_assignment_id
   and (p.role='admin' or (p.role='teacher' and c.teacher_id=v_teacher));
 if v_max is null then raise exception 'No autorizado para calificar este curso'; end if;
 if p_score is null or p_score < 0 or p_score > v_max then
   raise exception 'La calificación está fuera del máximo permitido';
 end if;
 if p_feedback is not null and length(p_feedback) > 3000 then
   raise exception 'Retroalimentación demasiado larga';
 end if;
 update public.assignment_submissions
 set score=p_score, feedback=coalesce(p_feedback,''), graded_by=v_teacher, graded_at=now()
 where assignment_id=p_assignment_id and user_id=p_student_id;
 if not found then raise exception 'Entrega inexistente'; end if;
 return true;
end; $$;

revoke all on function public.get_course_roster(uuid) from public, anon, authenticated;
grant execute on function public.get_course_roster(uuid) to authenticated;
revoke all on function public.submit_course_assignment(uuid,text) from public, anon, authenticated;
grant execute on function public.submit_course_assignment(uuid,text) to authenticated;
revoke all on function public.grade_course_submission(uuid,uuid,numeric,text) from public, anon, authenticated;
grant execute on function public.grade_course_submission(uuid,uuid,numeric,text) to authenticated;

-- Conservamos la RLS con privilegios mínimos. Nunca otorgar INSERT o UPDATE
-- de assignment_submissions directamente a authenticated.
