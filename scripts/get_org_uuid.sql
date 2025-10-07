insert into public.orgs (name) values ('Demo Org')
on conflict (name) do nothing;
select id, name, created_at from public.orgs where name='Demo Org';