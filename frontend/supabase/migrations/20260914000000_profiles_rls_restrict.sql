drop policy if exists "Authenticated users can read profiles" on public.profiles;

create policy "Users can read own profile or teammates"
  on public.profiles
  as permissive
  for select
  to authenticated
  using (
    (
      auth.uid() = user_id
    )
    or
    exists (
      select 1
      from public.team_members as mine
      where mine.user_id = auth.uid()
        and mine.left_at is null
        and mine.removed_at is null
        and exists (
          select 1
          from public.team_members as teammate
          where teammate.team_id = mine.team_id
            and teammate.user_id = profiles.user_id
            and teammate.left_at is null
            and teammate.removed_at is null
        )
    )
  );