delete from public.entries e
where not exists (
  select 1
  from auth.users u
  where u.id = e.user_id
);

alter table "public"."entries"
  add constraint "entries_user_id_fkey"
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
  ON DELETE CASCADE
  not valid;

alter table "public"."entries" validate constraint "entries_user_id_fkey";