-- Simulaciones de decisión clínica · Enfermería
-- Las respuestas correctas y el puntaje se procesan exclusivamente en el servidor.

alter table public.course_assignments drop constraint if exists course_assignments_kind_check;
alter table public.course_assignments add constraint course_assignments_kind_check
  check (kind in ('actividad','evaluacion','simulacion'));
alter table public.course_assignments add column if not exists scenario_id text;
alter table public.course_assignments add constraint course_assignments_scenario_check
  check (
    (kind='simulacion' and scenario_id in
       ('hipoglucemia-alerta','dificultad-respiratoria','deshidratacion-perfusion'))
    or (kind<>'simulacion' and scenario_id is null)
  );

create table if not exists private.simulation_answer_keys (
  scenario_id text primary key,
  answer_key jsonb not null,
  check(jsonb_typeof(answer_key)='object')
);
revoke all on private.simulation_answer_keys from public, anon, authenticated;
alter table private.simulation_answer_keys enable row level security;

insert into private.simulation_answer_keys(scenario_id,answer_key) values
 ('hipoglucemia-alerta','{"priority":"abc","assessment":"glucosa","tests":"glucometria","action":"carbohidrato","recheck":"recontrol"}'::jsonb),
 ('dificultad-respiratoria','{"priority":"oxigenacion","assessment":"respiracion","tests":"torax","action":"soporte","recheck":"sbar"}'::jsonb),
 ('deshidratacion-perfusion','{"priority":"perfusión","assessment":"balance","tests":"electrolitos","action":"soporte-perfusion","recheck":"revaluar-perfusion"}'::jsonb)
on conflict (scenario_id) do update set answer_key=excluded.answer_key;

create table if not exists public.simulation_attempts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.course_assignments(id) on delete cascade,
  user_id uuid not null references public.student_profiles(id) on delete cascade,
  scenario_id text not null,
  answers jsonb not null,
  score numeric(6,2) not null,
  max_score numeric(5,2) not null,
  created_at timestamptz not null default now(),
  constraint simulation_score_range check (score>=0 and score<=max_score)
);
create index if not exists simulation_attempts_assignment_idx on public.simulation_attempts(assignment_id,user_id,created_at desc);
alter table public.simulation_attempts enable row level security;
revoke all on public.simulation_attempts from public,anon,authenticated;
grant select on public.simulation_attempts to authenticated;

create policy "Simulaciones propias activas o de docente asignado" on public.simulation_attempts
for select to authenticated using(
  (
    user_id=(select auth.uid())
    and exists(
      select 1 from public.course_assignments a
      join public.course_enrollments e on e.course_id=a.course_id
      where a.id=simulation_attempts.assignment_id
      and a.published and e.user_id=(select auth.uid()) and e.status='active'
    )
  )
  or exists(
    select 1 from public.course_assignments a
    join public.academic_courses c on c.id=a.course_id
    join public.student_profiles p on p.id=(select auth.uid())
    where a.id=simulation_attempts.assignment_id and
      (p.role='admin' or (p.role='teacher' and c.teacher_id=(select auth.uid())))
  )
);

create or replace function public.submit_simulation_attempt(p_assignment_id uuid,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_user uuid := auth.uid();
 v_scenario text;
 v_course uuid;
 v_max numeric;
 v_key jsonb;
 v_keyname text;
 v_correct_count int := 0;
 v_safety_ok boolean := true;
 v_match boolean;
 v_grading jsonb := '{}'::jsonb;
 v_score numeric;
 v_attempt_id uuid;
 v_attempts int;
begin
 if v_user is null then raise exception 'Se requiere una sesión de estudiante'; end if;
 select a.scenario_id,a.course_id,a.max_score
 into v_scenario,v_course,v_max
 from public.course_assignments a
 where a.id=p_assignment_id and a.kind='simulacion' and a.published
   and (a.due_at is null or a.due_at >= now());

 if v_course is null then raise exception 'Simulación no disponible o fuera de plazo'; end if;
 if not exists(select 1 from public.course_enrollments e
               where e.course_id=v_course and e.user_id=v_user and e.status='active')
 then raise exception 'No tienes matrícula activa para esta simulación'; end if;

 if p_answers is null or jsonb_typeof(p_answers)<>'object'
    or (select count(*) from jsonb_object_keys(p_answers))<>5
    or not (p_answers ?& array['priority','assessment','tests','action','recheck'])
 then raise exception 'Completa las cinco etapas del caso clínico'; end if;

 select answer_key into v_key
 from private.simulation_answer_keys k where k.scenario_id=v_scenario;
 if v_key is null then raise exception 'Caso no configurado'; end if;

 foreach v_keyname in array array['priority','assessment','tests','action','recheck']
 loop
   if jsonb_typeof(p_answers->v_keyname)<>'string'
     or length(p_answers->>v_keyname)>64 then
     raise exception 'Respuestas con formato inválido';
   end if;
   v_match := (p_answers->>v_keyname) = (v_key->>v_keyname);
   v_grading := v_grading || jsonb_build_object(v_keyname, v_match);
   if v_match then v_correct_count:=v_correct_count+1; end if;
   if v_keyname in ('priority','action') and not v_match then
      v_safety_ok:=false;
   end if;
 end loop;

 select count(*) into v_attempts from public.simulation_attempts
 where assignment_id=p_assignment_id and user_id=v_user;
 if v_attempts>=5 then raise exception 'Has agotado los 5 intentos de esta simulación'; end if;
 v_score := round(v_max * least(v_correct_count,case when v_safety_ok then 5 else 3 end)::numeric/5,2);
 insert into public.simulation_attempts(assignment_id,user_id,scenario_id,answers,score,max_score)
 values(p_assignment_id,v_user,v_scenario,p_answers,v_score,v_max)
 returning id into v_attempt_id;
 return jsonb_build_object(
    'ok',true,'attempt_id',v_attempt_id,'score',v_score,'max_score',v_max,
    'correct_count',v_correct_count,'safety_cap_applied',not v_safety_ok,
    'checks',v_grading,'attempt_number',v_attempts+1
 );
end; $$;

revoke all on function public.submit_simulation_attempt(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.submit_simulation_attempt(uuid,jsonb) to authenticated;
