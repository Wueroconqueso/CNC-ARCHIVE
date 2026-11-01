create policy "Public read for mastercam-pdfs"
on storage.objects for select
using (bucket_id = 'mastercam-pdfs');

create policy "Public insert for mastercam-pdfs"
on storage.objects for insert
with check (bucket_id = 'mastercam-pdfs');

create policy "Public delete for mastercam-pdfs"
on storage.objects for delete
using (bucket_id = 'mastercam-pdfs');
