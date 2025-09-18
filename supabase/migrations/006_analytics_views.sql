-- 006_analytics_views.sql
-- Purpose: Analytics-friendly views, materialized views and indexes for user collections and whiskies
-- Run once as a migration.

-- 1) View: user_whiskies_enriched
create or replace view public.user_whiskies_enriched as
select
  uw.id,
  uw.user_id,
  uw.whisky_id,
  uw.tasted,
  uw.rating as user_rating,
  uw.personal_notes,
  uw.tasted_at,
  uw.created_at as added_at,
  w.name,
  w.type,
  w.country,
  w.region,
  w.alcohol_percentage,
  w.age_years,
  w.rating as global_rating,
  w.created_at as whisky_created_at
from public.user_whiskies uw
join public.whiskies w on w.id = uw.whisky_id;

-- 2) View: collection_aggregates
create or replace view public.collection_aggregates as
with per_user as (
  select user_id, count(*) as user_items
  from public.user_whiskies
  group by user_id
)
select
  (select count(*) from public.user_whiskies) as total_collection_items,
  (select count(distinct user_id) from public.user_whiskies) as active_collectors,
  avg(user_items) as avg_items_per_user
from per_user;

-- 3) Materialized View: top_whiskies_by_collection
-- Note: To allow CONCURRENTLY refresh, we create a unique index on whisky_id.
create materialized view if not exists public.top_whiskies_by_collection as
select whisky_id, count(*) as collection_count
from public.user_whiskies
group by whisky_id
order by collection_count desc;

create unique index if not exists idx_top_whiskies_by_collection_unique
  on public.top_whiskies_by_collection(whisky_id);

-- 4) Materialized View: trends_collection_daily
create materialized view if not exists public.trends_collection_daily as
select
  date_trunc('day', created_at)::date as day,
  count(*) as items_added
from public.user_whiskies
group by 1
order by 1;

create unique index if not exists idx_trends_collection_daily_unique
  on public.trends_collection_daily(day);

-- 5) View: taste_and_rating_stats_by_segment
create or replace view public.taste_and_rating_stats_by_segment as
select
  country,
  type,
  count(*) filter (where tasted) as tasted_count,
  avg(user_rating) as avg_user_rating,
  avg(global_rating) as avg_global_rating
from public.user_whiskies_enriched
group by country, type;

-- 6) View: notes_basic_stats
create or replace view public.notes_basic_stats as
select
  count(*) filter (where personal_notes is not null and length(trim(personal_notes)) > 0) as notes_count,
  (count(*) filter (where personal_notes is not null and length(trim(personal_notes)) > 0))::float
    / nullif(count(*), 0) as notes_ratio,
  avg(length(personal_notes)) filter (where personal_notes is not null) as avg_note_length
from public.user_whiskies;

-- 7) Helpful indexes
-- user_whiskies
create index if not exists idx_user_whiskies_user on public.user_whiskies(user_id);
create index if not exists idx_user_whiskies_whisky on public.user_whiskies(whisky_id);
create index if not exists idx_user_whiskies_created_at on public.user_whiskies(created_at);
create index if not exists idx_user_whiskies_tasted on public.user_whiskies(tasted);

-- whiskies
create index if not exists idx_whiskies_country_type on public.whiskies(country, type);
create index if not exists idx_whiskies_created_at on public.whiskies(created_at);

-- 8) Grants (optional): restrict analytics views to admin role only
-- Uncomment and adjust if you have an admin role configured.
-- revoke all on table public.user_whiskies_enriched from public;
-- revoke all on table public.collection_aggregates from public;
-- revoke all on table public.top_whiskies_by_collection from public;
-- revoke all on table public.trends_collection_daily from public;
-- revoke all on table public.taste_and_rating_stats_by_segment from public;
-- revoke all on table public.notes_basic_stats from public;
--
-- grant select on table public.user_whiskies_enriched to admin;
-- grant select on table public.collection_aggregates to admin;
-- grant select on table public.top_whiskies_by_collection to admin;
-- grant select on table public.trends_collection_daily to admin;
-- grant select on table public.taste_and_rating_stats_by_segment to admin;
-- grant select on table public.notes_basic_stats to admin;

-- 9) Optional: example refresh statements
-- REFRESH MATERIALIZED VIEW CONCURRENTLY public.top_whiskies_by_collection;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY public.trends_collection_daily;
