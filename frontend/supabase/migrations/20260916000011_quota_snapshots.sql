create table "public"."quota_snapshots" (
  "id" bigint generated always as identity,
  "recorded_at" timestamp with time zone not null default now(),
  "period_end" date not null,
  "requests" jsonb not null default '{}'::jsonb,
  "usage" jsonb not null default '{}'::jsonb,
  "limits" jsonb not null default '{}'::jsonb
);

alter table "public"."quota_snapshots" enable row level security;

alter table "public"."quota_snapshots" add constraint "quota_snapshots_pkey" PRIMARY KEY (id);

create index quota_snapshots_period_end_idx on public.quota_snapshots (period_end desc);

create policy "Users can read quota snapshots"
  on "public"."quota_snapshots"
  as permissive
  for select
  to authenticated
  using (true);

grant select on table "public"."quota_snapshots" to "authenticated";