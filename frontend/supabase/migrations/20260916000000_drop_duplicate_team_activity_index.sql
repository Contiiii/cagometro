-- Performance: rimozione indice duplicato su team_activity
-- La stessa definizione (team_id, created_at desc) è già coperta
-- da team_activity_team_created_idx.
drop index if exists public.idx_team_activity_team_created;