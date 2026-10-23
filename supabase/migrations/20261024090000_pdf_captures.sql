-- PDFs dropped into the app are their own source type, so the Vault can show them as PDFs.
alter table public.captures drop constraint if exists captures_type_check;
alter table public.captures
  add constraint captures_type_check check (type in ('youtube', 'url', 'text', 'tweet', 'pdf'));
