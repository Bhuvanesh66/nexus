-- Videos and audio dropped into Nexus: transcribed into fragments, the original kept privately for replay.

alter table public.captures drop constraint if exists captures_type_check;
alter table public.captures
  add constraint captures_type_check
  check (type in ('youtube', 'url', 'text', 'tweet', 'pdf', 'video', 'audio'));

-- Where the original file lives in the private "uploads" bucket, when there is one.
alter table public.captures add column if not exists media_path text;

-- Private bucket, 50 MB per file (the free plan's ceiling), video and audio only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', false, 52428800, array['video/*', 'audio/*'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Each user reads, writes and deletes only inside their own folder: uploads/<user id>/...
create policy "users upload to their own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "users read their own uploads" on storage.objects for select to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "users delete their own uploads" on storage.objects for delete to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = (select auth.uid())::text);
