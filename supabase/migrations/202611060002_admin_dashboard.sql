begin;
alter table public.admission_enquiries add column if not exists notes text not null default '' check (char_length(notes)<=5000);
alter table public.admission_enquiries add column if not exists updated_at timestamptz not null default now();
grant select,update on public.admission_enquiries to service_role;
create table if not exists public.admin_login_attempts(bucket text primary key,window_start timestamptz not null,attempts integer not null);
alter table public.admin_login_attempts enable row level security;
revoke all on public.admin_login_attempts from anon,authenticated;
create or replace function public.consume_admin_login_attempt(p_key text)
returns boolean language plpgsql security definer set search_path='' as $$
declare tries integer;
begin
 if p_key is null or p_key !~ '^[0-9a-f]{64}$' then return false; end if;
 insert into public.admin_login_attempts(bucket,window_start,attempts) values(p_key,now(),1)
 on conflict(bucket) do update set
 attempts=case when public.admin_login_attempts.window_start<now()-interval '15 minutes' then 1 else public.admin_login_attempts.attempts+1 end,
 window_start=case when public.admin_login_attempts.window_start<now()-interval '15 minutes' then now() else public.admin_login_attempts.window_start end
 returning attempts into tries;
 delete from public.admin_login_attempts where window_start<now()-interval '1 day';
 return tries<=10;
end;$$;
revoke all on function public.consume_admin_login_attempt(text) from public,anon,authenticated;
grant execute on function public.consume_admin_login_attempt(text) to service_role;
commit;
