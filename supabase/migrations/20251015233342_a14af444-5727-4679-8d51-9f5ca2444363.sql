-- Create the ccm-invoices storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('ccm-invoices', 'ccm-invoices', false)
on conflict (id) do nothing;

-- Create RLS policies for the ccm-invoices bucket to allow uploads
create policy "Allow public uploads to ccm-invoices"
on storage.objects for insert
with check (bucket_id = 'ccm-invoices');

create policy "Allow public reads from ccm-invoices"
on storage.objects for select
using (bucket_id = 'ccm-invoices');

create policy "Allow public updates to ccm-invoices"
on storage.objects for update
using (bucket_id = 'ccm-invoices');

create policy "Allow public deletes from ccm-invoices"
on storage.objects for delete
using (bucket_id = 'ccm-invoices');