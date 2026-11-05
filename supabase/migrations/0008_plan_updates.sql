-- Saved plans can be opened again, edited and deleted by their owner, so a
-- plan records when it last changed. Older rows keep null: never edited.

alter table public.plans
  add column updated_at timestamptz;
