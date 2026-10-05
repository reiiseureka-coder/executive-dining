-- PROPOSAL ONLY: not applied and intentionally outside supabase/migrations.
-- Requires explicit approval before live application. Does not alter data, roles or gates.
-- Base: repo 202610050001_nagoya_foundation.sql, SHA-256
-- 84d5e91be8a42eb778514c483ce17735624395601aba7de947179b394df2724e.
-- Actual existing server history: 20261005102621 nagoya_foundation.
-- Reconcile history before any CLI migration push; do not rewrite/reapply the base.
begin;
create or replace function public.dining_public_catalog() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'status', r.status, 'name', n.value, 'address', a.value, 'verifiedAt', r.verified_at,
    'facts', dining_private.fact_json(r.id),
    'reviews', (select coalesce(jsonb_agg(jsonb_build_object(
      'id', v.id, 'displayName', v.display_name, 'rating', v.rating, 'comment', v.comment,
      'visitedMonth', to_char(v.visited_month, 'YYYY-MM'), 'publishedAt', v.published_at
    ) order by v.published_at desc), '[]'::jsonb) from dining_private.reviews v
      where v.restaurant_id = r.id and v.status = 'approved' and v.author_id is not null and (select reviews_enabled from dining_private.settings))
  ) order by n.value), '[]'::jsonb)
  from dining_private.restaurants r
  join dining_private.restaurant_facts n on n.restaurant_id = r.id and n.field = 'name'
  join dining_private.restaurant_facts a on a.restaurant_id = r.id and a.field = 'address'
  where r.status = 'verified' and (select public_enabled from dining_private.settings)
    -- Re-evaluate core source eligibility on EVERY public read. Initial moderation is insufficient
    -- when a source is later revoked, unverified, or reclassified by an authorized operator.
    and (select count(*) from dining_private.restaurant_facts f
      join dining_private.restaurant_sources s on s.id = f.source_id and s.restaurant_id = f.restaurant_id
      where f.restaurant_id = r.id and f.field in ('name', 'address', 'website')
        and s.provider = 'official' and s.publication_basis = 'facts_only'
        and s.verified_at is not null and s.license_reviewed_at is not null) = 3;
$$;

-- CREATE OR REPLACE retains the existing function signature and execute privileges.
commit;
