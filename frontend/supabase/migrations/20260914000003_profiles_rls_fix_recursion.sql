-- Fix: "infinite recursion detected in policy for relation team_members"
-- La policy SELECT su profiles interroga team_members direttamente; la policy
-- SELECT di team_members si auto-riferisce generando ricorsione infinita (42P17).
-- Soluzione: helper SECURITY DEFINER che valuta la co-membership bypassando RLS.

create or replace function public.is_teammate(target_user_id uuid)
 returns boolean
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.team_members mine
    where mine.user_id = auth.uid()
      and mine.left_at is null
      and mine.removed_at is null
      and exists (
        select 1
        from public.team_members teammate
        where teammate.team_id = mine.team_id
          and teammate.user_id = target_user_id
          and teammate.left_at is null
          and teammate.removed_at is null
      )
  );
$function$
;

grant execute on function public.is_teammate(uuid) to authenticated;

drop policy if exists "Users can read own profile or teammates"
  on public.profiles;

create policy "Users can read own profile or teammates"
  on public.profiles
  as permissive
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.is_teammate(profiles.user_id)
  );