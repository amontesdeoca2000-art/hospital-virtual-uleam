-- Hospital Virtual ULEAM · Extensiones, cuentas y matrícula por clave
-- Requiere proyecto Supabase nuevo o previamente revisado.
-- Ejecutar desde SQL Editor como propietario de la base de datos.
-- NUNCA guardar las claves de matrícula ni la service_role en el frontend.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.student_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 4 and 160),
  extension text not null check (extension in ('Pedernales', 'Chone', 'Tosagua')),
  role text not null default 'student' check (role in ('student','teacher','admin')),
  created_at timestamptz not null default now()
);
alter table public.student_profiles enable row level security;
revoke insert, update, delete on public.student_profiles from anon, authenticated;
grant select on public.student_profiles to authenticated;
create policy "Perfil propio" on public.student_profiles for select to authenticated
  using (id = (select auth.uid()));

create or replace function public.create_student_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_name text; v_extension text;
begin
  v_name := btrim(coalesce(new.raw_user_meta_data->>'full_name',''));
  v_extension := btrim(coalesce(new.raw_user_meta_data->>'extension',''));
  -- No permitir que los metadatos del registro otorguen roles o privilegios.
  if length(v_name) < 4 or length(v_name) > 160 or v_extension not in ('Pedernales','Chone','Tosagua') then
    raise exception 'Datos de registro inválidos';
  end if;
  insert into public.student_profiles(id,full_name,extension,role)
  values (new.id, v_name, v_extension, 'student');
  return new;
end; $$;
revoke execute on function public.create_student_profile() from public, anon, authenticated;
drop trigger if exists create_student_profile_on_signup on auth.users;
create trigger create_student_profile_on_signup after insert on auth.users
  for each row execute procedure public.create_student_profile();

create table if not exists public.academic_courses (
  id uuid primary key default gen_random_uuid(),
  extension text not null check(extension in ('Pedernales','Chone','Tosagua')),
  career_id text not null check(career_id in ('enfermeria','fisioterapia')),
  subject_id text not null,
  title text not null check(length(btrim(title)) between 4 and 180),
  level_name text not null default 'Primer semestre',
  parallel text not null default 'A',
  academic_term text not null default '2026-2',
  teacher_id uuid references public.student_profiles(id) on delete set null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  unique(extension,career_id,subject_id,academic_term,parallel)
);
create index if not exists academic_courses_teacher_idx on public.academic_courses(teacher_id);
alter table public.academic_courses enable row level security;
grant select,insert,update on public.academic_courses to authenticated;
revoke delete on public.academic_courses from authenticated, anon;
create policy "Catálogo publicado o propio de docente" on public.academic_courses for select
to authenticated using (
  (published and extension = (select p.extension from public.student_profiles p where p.id=(select auth.uid())))
  or teacher_id = (select auth.uid())
  or exists(select 1 from public.student_profiles p
            where p.id=(select auth.uid()) and p.role='admin')
);
create policy "Docentes crean cursos propios" on public.academic_courses for insert
to authenticated with check (
  exists(select 1 from public.student_profiles p where p.id=(select auth.uid()) and
    (p.role='admin' or (p.role='teacher' and teacher_id=(select auth.uid()))))
);
create policy "Docentes administran cursos propios" on public.academic_courses for update
to authenticated using (
  exists(select 1 from public.student_profiles p where p.id=(select auth.uid()) and
    (p.role='admin' or (p.role='teacher' and teacher_id=(select auth.uid()))))
) with check (
  exists(select 1 from public.student_profiles p where p.id=(select auth.uid()) and
    (p.role='admin' or (p.role='teacher' and teacher_id=(select auth.uid()))))
);

create table if not exists public.course_enrollments (
  user_id uuid not null references public.student_profiles(id) on delete cascade,
  course_id uuid not null references public.academic_courses(id) on delete cascade,
  status text not null default 'active' check(status in ('active','blocked')),
  enrolled_at timestamptz not null default now(),
  primary key (user_id, course_id)
);
create index if not exists course_enrollments_course_idx on public.course_enrollments(course_id);
alter table public.course_enrollments enable row level security;
grant select on public.course_enrollments to authenticated;
revoke insert,update,delete on public.course_enrollments from anon,authenticated;
create policy "Matrículas propias o del docente asignado" on public.course_enrollments for select
to authenticated using(
  user_id=(select auth.uid()) or exists (
    select 1 from public.academic_courses c
    where c.id=course_id and c.teacher_id=(select auth.uid())
  ) or exists (
    select 1 from public.student_profiles p where p.id=(select auth.uid()) and p.role='admin'
  )
);

-- No expuestos por la API REST: nadie puede listar las claves ni intentos.
create table if not exists private.course_enrollment_codes (
  course_id uuid primary key references public.academic_courses(id) on delete cascade,
  secret_hash text not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id)
);
create table if not exists private.code_attempt_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.academic_courses(id) on delete cascade,
  window_started timestamptz not null default now(),
  attempts integer not null default 0,
  primary key(user_id,course_id)
);

create or replace function public.set_course_enrollment_code(p_course_id uuid,p_code text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null or p_code is null or p_code !~ '^[A-Za-z0-9_-]{10,64}  if not exists(
    select 1 from public.academic_courses c
    join public.student_profiles p on p.id=v_user
    where c.id=p_course_id and (
      p.role='admin' or (p.role='teacher' and c.teacher_id=v_user)
    )
  ) then raise exception 'No estás autorizado a administrar este curso'; end if;
  insert into private.course_enrollment_codes(course_id,secret_hash,changed_by)
  values(p_course_id, extensions.crypt(p_code, extensions.gen_salt('bf',10)),v_user)
  on conflict(course_id) do update
    set secret_hash=excluded.secret_hash, changed_at=now(), changed_by=v_user;
  -- La clave solo se muestra al docente cuando la introduce: nunca puede recuperarse.
  return true;
end; $$;
revoke all on function public.set_course_enrollment_code(uuid,text) from public, anon, authenticated;
grant execute on function public.set_course_enrollment_code(uuid,text) to authenticated;

create or replace function public.enroll_in_academic_course(p_course_id uuid,p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_extension text;
  v_course_extension text;
  v_hash text;
  v_attempts int;
begin
  if v_user is null then return jsonb_build_object('ok',false,'message','Debes iniciar sesión.'); end if;
  select p.extension into v_extension from public.student_profiles p where p.id=v_user;
  select c.extension into v_course_extension from public.academic_courses c
    where c.id=p_course_id and c.published;
  if v_course_extension is null or v_extension <> v_course_extension then
    return jsonb_build_object('ok',false,'message','Este curso no está disponible para tu extensión.');
  end if;
  if exists(select 1 from public.course_enrollments e
    where e.course_id=p_course_id and e.user_id=v_user and e.status='active') then
    return jsonb_build_object('ok',true,'message','Ya estás matriculado en este curso.');
  end if;
  if exists(select 1 from public.course_enrollments e
    where e.course_id=p_course_id and e.user_id=v_user and e.status='blocked') then
    return jsonb_build_object('ok',false,'message','Tu matrícula está bloqueada. Contacta al docente.');
  end if;

  -- Contador se conserva incluso si la clave falla: no generar excepción por error de clave.
  insert into private.code_attempt_limits(user_id,course_id,window_started,attempts)
  values(v_user,p_course_id,now(),1)
  on conflict(user_id,course_id) do update set
    attempts=case when private.code_attempt_limits.window_started < now()-interval '15 minutes'
      then 1 else private.code_attempt_limits.attempts+1 end,
    window_started=case when private.code_attempt_limits.window_started < now()-interval '15 minutes'
      then now() else private.code_attempt_limits.window_started end
  returning attempts into v_attempts;
  if v_attempts > 5 then
    return jsonb_build_object('ok',false,'message','Demasiados intentos. Inténtalo después de 15 minutos.');
  end if;

  select secret_hash into v_hash from private.course_enrollment_codes
    where course_id=p_course_id;
  if p_code is null or v_hash is null or
     extensions.crypt(p_code,v_hash) <> v_hash then
    return jsonb_build_object('ok',false,'message','Clave de matrícula incorrecta.');
  end if;
  insert into public.course_enrollments(user_id,course_id,status)
  values(v_user,p_course_id,'active') on conflict(user_id,course_id) do nothing;
  delete from private.code_attempt_limits where user_id=v_user and course_id=p_course_id;
  return jsonb_build_object('ok',true,'message','Matrícula registrada correctamente.');
end; $$;
revoke all on function public.enroll_in_academic_course(uuid,text) from public, anon, authenticated;
grant execute on function public.enroll_in_academic_course(uuid,text) to authenticated;

create table if not exists public.course_materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.academic_courses(id) on delete cascade,
  kind text not null check (kind in ('bone-library','reading','activity')),
  title text not null,
  description text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists course_materials_course_idx on public.course_materials(course_id);
alter table public.course_materials enable row level security;
grant select,insert,update on public.course_materials to authenticated;
revoke delete on public.course_materials from authenticated,anon;
create policy "Material solo para matriculados y docentes" on public.course_materials
for select to authenticated using (
  (published and exists(
    select 1 from public.course_enrollments e
    where e.course_id=course_materials.course_id and
      e.user_id=(select auth.uid()) and e.status='active'
  ))
  or exists(select 1 from public.academic_courses c
    where c.id=course_materials.course_id and c.teacher_id=(select auth.uid()))
  or exists(select 1 from public.student_profiles p
    where p.id=(select auth.uid()) and p.role='admin')
);
create policy "Docente publica materiales de su curso" on public.course_materials for insert
to authenticated with check (
  exists(select 1 from public.academic_courses c
  join public.student_profiles p on p.id=(select auth.uid())
  where c.id=course_id and
    (p.role='admin' or (p.role='teacher' and c.teacher_id=(select auth.uid())))
    and (kind <> 'bone-library' or c.subject_id='fundamentos'))
);
create policy "Docente edita materiales de su curso" on public.course_materials for update
to authenticated using (
  exists(select 1 from public.academic_courses c
  join public.student_profiles p on p.id=(select auth.uid())
  where c.id=course_id and
    (p.role='admin' or (p.role='teacher' and c.teacher_id=(select auth.uid())))
    and (kind <> 'bone-library' or c.subject_id='fundamentos'))
) with check(
  exists(select 1 from public.academic_courses c
  join public.student_profiles p on p.id=(select auth.uid())
  where c.id=course_id and
    (p.role='admin' or (p.role='teacher' and c.teacher_id=(select auth.uid())))
    and (kind <> 'bone-library' or c.subject_id='fundamentos'))
);

create table if not exists public.bone_study_progress (
  user_id uuid not null references public.student_profiles(id) on delete cascade,
  course_id uuid not null references public.academic_courses(id) on delete cascade,
  bone_id text not null,
  studied_at timestamptz not null default now(),
  primary key (user_id,course_id,bone_id)
);
alter table public.bone_study_progress enable row level security;
grant select,insert,delete on public.bone_study_progress to authenticated;
revoke update on public.bone_study_progress from authenticated,anon;
create policy "Progreso propio" on public.bone_study_progress for select
to authenticated using(user_id=(select auth.uid()));
create policy "Guardar progreso solo en matrícula propia" on public.bone_study_progress for insert
to authenticated with check(
  user_id=(select auth.uid())
  and bone_id ~ '^hueso-([1-9]|[1-9][0-9]|1[0-9][0-9]|20[0-6])$'
  and exists(
    select 1 from public.course_enrollments e
    join public.academic_courses c on c.id=e.course_id
    where e.course_id=bone_study_progress.course_id and e.user_id=(select auth.uid())
      and e.status='active' and c.subject_id='fundamentos'
  )
);
create policy "Retirar marca de progreso propio" on public.bone_study_progress for delete
to authenticated using(user_id=(select auth.uid()));

-- Solo la matrícula confirmada desde servidor habilita los datos del aula.
-- Los códigos nunca se publican en el frontend; no insertar claves de ejemplo.
 then
    raise exception 'Usa una clave de 10 a 64 caracteres: letras, números, guion o guion bajo';
  end if;
  if not exists(
    select 1 from public.academic_courses c
    join public.student_profiles p on p.id=v_user
    where c.id=p_course_id and (
      p.role='admin' or (p.role='teacher' and c.teacher_id=v_user)
    )
  ) then raise exception 'No estás autorizado a administrar este curso'; end if;
  insert into private.course_enrollment_codes(course_id,secret_hash,changed_by)
  values(p_course_id, extensions.crypt(p_code, extensions.gen_salt('bf',10)),v_user)
  on conflict(course_id) do update
    set secret_hash=excluded.secret_hash, changed_at=now(), changed_by=v_user;
  -- La clave solo se muestra al docente cuando la introduce: nunca puede recuperarse.
  return true;
end; $$;
revoke all on function public.set_course_enrollment_code(uuid,text) from public, anon, authenticated;
grant execute on function public.set_course_enrollment_code(uuid,text) to authenticated;

create or replace function public.enroll_in_academic_course(p_course_id uuid,p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_extension text;
  v_course_extension text;
  v_hash text;
  v_attempts int;
begin
  if v_user is null then return jsonb_build_object('ok',false,'message','Debes iniciar sesión.'); end if;
  select p.extension into v_extension from public.student_profiles p where p.id=v_user;
  select c.extension into v_course_extension from public.academic_courses c
    where c.id=p_course_id and c.published;
  if v_course_extension is null or v_extension <> v_course_extension then
    return jsonb_build_object('ok',false,'message','Este curso no está disponible para tu extensión.');
  end if;
  if exists(select 1 from public.course_enrollments e
    where e.course_id=p_course_id and e.user_id=v_user and e.status='active') then
    return jsonb_build_object('ok',true,'message','Ya estás matriculado en este curso.');
  end if;
  if exists(select 1 from public.course_enrollments e
    where e.course_id=p_course_id and e.user_id=v_user and e.status='blocked') then
    return jsonb_build_object('ok',false,'message','Tu matrícula está bloqueada. Contacta al docente.');
  end if;

  -- Contador se conserva incluso si la clave falla: no generar excepción por error de clave.
  insert into private.code_attempt_limits(user_id,course_id,window_started,attempts)
  values(v_user,p_course_id,now(),1)
  on conflict(user_id,course_id) do update set
    attempts=case when private.code_attempt_limits.window_started < now()-interval '15 minutes'
      then 1 else private.code_attempt_limits.attempts+1 end,
    window_started=case when private.code_attempt_limits.window_started < now()-interval '15 minutes'
      then now() else private.code_attempt_limits.window_started end
  returning attempts into v_attempts;
  if v_attempts > 5 then
    return jsonb_build_object('ok',false,'message','Demasiados intentos. Inténtalo después de 15 minutos.');
  end if;

  select secret_hash into v_hash from private.course_enrollment_codes
    where course_id=p_course_id;
  if p_code is null or v_hash is null or
     extensions.crypt(p_code,v_hash) <> v_hash then
    return jsonb_build_object('ok',false,'message','Clave de matrícula incorrecta.');
  end if;
  insert into public.course_enrollments(user_id,course_id,status)
  values(v_user,p_course_id,'active') on conflict(user_id,course_id) do nothing;
  delete from private.code_attempt_limits where user_id=v_user and course_id=p_course_id;
  return jsonb_build_object('ok',true,'message','Matrícula registrada correctamente.');
end; $$;
revoke all on function public.enroll_in_academic_course(uuid,text) from public, anon, authenticated;
grant execute on function public.enroll_in_academic_course(uuid,text) to authenticated;

create table if not exists public.course_materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.academic_courses(id) on delete cascade,
  kind text not null check (kind in ('bone-library','reading','activity')),
  title text not null,
  description text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists course_materials_course_idx on public.course_materials(course_id);
alter table public.course_materials enable row level security;
grant select,insert,update on public.course_materials to authenticated;
revoke delete on public.course_materials from authenticated,anon;
create policy "Material solo para matriculados y docentes" on public.course_materials
for select to authenticated using (
  (published and exists(
    select 1 from public.course_enrollments e
    where e.course_id=course_materials.course_id and
      e.user_id=(select auth.uid()) and e.status='active'
  ))
  or exists(select 1 from public.academic_courses c
    where c.id=course_materials.course_id and c.teacher_id=(select auth.uid()))
  or exists(select 1 from public.student_profiles p
    where p.id=(select auth.uid()) and p.role='admin')
);
create policy "Docente publica materiales de su curso" on public.course_materials for insert
to authenticated with check (
  exists(select 1 from public.academic_courses c
  join public.student_profiles p on p.id=(select auth.uid())
  where c.id=course_id and
    (p.role='admin' or (p.role='teacher' and c.teacher_id=(select auth.uid())))
    and (kind <> 'bone-library' or c.subject_id='fundamentos'))
);
create policy "Docente edita materiales de su curso" on public.course_materials for update
to authenticated using (
  exists(select 1 from public.academic_courses c
  join public.student_profiles p on p.id=(select auth.uid())
  where c.id=course_id and
    (p.role='admin' or (p.role='teacher' and c.teacher_id=(select auth.uid())))
    and (kind <> 'bone-library' or c.subject_id='fundamentos'))
) with check(
  exists(select 1 from public.academic_courses c
  join public.student_profiles p on p.id=(select auth.uid())
  where c.id=course_id and
    (p.role='admin' or (p.role='teacher' and c.teacher_id=(select auth.uid())))
    and (kind <> 'bone-library' or c.subject_id='fundamentos'))
);

create table if not exists public.bone_study_progress (
  user_id uuid not null references public.student_profiles(id) on delete cascade,
  course_id uuid not null references public.academic_courses(id) on delete cascade,
  bone_id text not null,
  studied_at timestamptz not null default now(),
  primary key (user_id,course_id,bone_id)
);
alter table public.bone_study_progress enable row level security;
grant select,insert,delete on public.bone_study_progress to authenticated;
revoke update on public.bone_study_progress from authenticated,anon;
create policy "Progreso propio" on public.bone_study_progress for select
to authenticated using(user_id=(select auth.uid()));
create policy "Guardar progreso solo en matrícula propia" on public.bone_study_progress for insert
to authenticated with check(
  user_id=(select auth.uid())
  and bone_id ~ '^hueso-([1-9]|[1-9][0-9]|1[0-9][0-9]|20[0-6])$'
  and exists(
    select 1 from public.course_enrollments e
    join public.academic_courses c on c.id=e.course_id
    where e.course_id=bone_study_progress.course_id and e.user_id=(select auth.uid())
      and e.status='active' and c.subject_id='fundamentos'
  )
);
create policy "Retirar marca de progreso propio" on public.bone_study_progress for delete
to authenticated using(user_id=(select auth.uid()));

-- Solo la matrícula confirmada desde servidor habilita los datos del aula.
-- Los códigos nunca se publican en el frontend; no insertar claves de ejemplo.
