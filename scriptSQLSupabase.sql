-- =========================================================
-- News Sport Auto-Moto : création de la base de données
-- =========================================================

-- 1. Table des news
create table public.news_sport_meca (
  id              uuid primary key default gen_random_uuid(),
  sport_meca      text not null,
  synthese        text,
  date_creation   timestamptz not null default now(),
  user_id         uuid not null default auth.uid()
                  references auth.users (id) on delete cascade,
  statut          text not null default 'en_cours'
                  check (statut in ('en_cours', 'succes', 'erreur')),
  message_erreur  text
);

-- 2. Index pour afficher rapidement l'historique de chaque utilisateur
create index news_sport_meca_user_id_idx
  on public.news_sport_meca (user_id);

-- 3. Sécurité : Row Level Security
alter table public.news_sport_meca enable row level security;

create policy "Chacun lit ses propres news"
  on public.news_sport_meca
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Chacun crée ses propres news"
  on public.news_sport_meca
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Aucune policy update / delete : la mise à jour de la synthèse et du statut
-- est faite par le job QStash avec la clé service_role, qui ignore le RLS.