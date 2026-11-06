-- Run once in Supabase SQL Editor. Public visitors may submit through the RPC only.
begin;
create table public.admission_enquiries (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null unique,
 created_at timestamptz not null default now(),
 parent_name text not null check (char_length(parent_name) between 2 and 100),
 phone text not null check (char_length(phone) between 7 and 20),
 email text check (char_length(email)<=254),
 programme text not null check (programme in ('Day Care','Junior KG','Senior KG','After School')),
 message text check (char_length(message)<=2000),
 consent_at timestamptz not null default now(),
 consent_version text not null default 'admissions-v1',
 status text not null default 'new' check (status in ('new','contacted','closed'))
);
alter table public.admission_enquiries enable row level security;
revoke all on public.admission_enquiries from anon,authenticated;
-- No public SELECT, UPDATE, DELETE or direct INSERT policies. Staff use the dashboard.
create index admission_enquiries_created_at_idx on public.admission_enquiries(created_at desc);
create index admission_enquiries_phone_idx on public.admission_enquiries(phone,created_at);
create or replace function public.submit_admission_enquiry(
 p_request_id uuid,p_parent text,p_phone text,p_email text,p_programme text,p_message text
) returns uuid language plpgsql security definer set search_path='' as $$
declare result_id uuid; normalized_phone text;
begin
 if p_request_id is null or p_parent is null or char_length(btrim(p_parent)) not between 2 and 100
 or p_phone is null or p_phone !~ '^\+?[0-9 ()-]{7,20}$'
 or char_length(regexp_replace(p_phone,'[^0-9]','','g'))<7
 or p_programme is null or p_programme not in ('Day Care','Junior KG','Senior KG','After School')
 or char_length(coalesce(p_message,''))>2000 or char_length(coalesce(p_email,''))>254
 or (coalesce(p_email,'')<>'' and p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
 then raise exception 'INVALID_ENQUIRY' using errcode='22023'; end if;
 normalized_phone:=regexp_replace(p_phone,'[^0-9]','','g');
 perform pg_advisory_xact_lock(hashtextextended(normalized_phone,0));
 select id into result_id from public.admission_enquiries where request_id=p_request_id;
 if result_id is not null then return result_id; end if;
 if (select count(*) from public.admission_enquiries where phone=normalized_phone and created_at>now()-interval '15 minutes')>=3
 then raise exception 'ENQUIRY_RATE_LIMIT' using errcode='P0001'; end if;
 insert into public.admission_enquiries(request_id,parent_name,phone,email,programme,message)
 values(p_request_id,btrim(p_parent),normalized_phone,nullif(btrim(p_email),''),p_programme,nullif(btrim(p_message),'')) returning id into result_id;
 return result_id;
end;
$$;
revoke all on function public.submit_admission_enquiry(uuid,text,text,text,text,text) from public;
grant execute on function public.submit_admission_enquiry(uuid,text,text,text,text,text) to anon,authenticated;
commit;
