-- Planters give their land in acres or hectares, whichever they know it in.
-- `area` and `area_unit` keep what they entered, to show it back the same
-- way; `area_ha` stays the same land in hectares, set by the server, for
-- yields per hectare. Existing plantations were entered in hectares.

alter table public.plantations
  add column area numeric,
  add column area_unit text not null default 'ha' check (area_unit in ('ha', 'acres'));

update public.plantations set area = area_ha where area is null;

alter table public.plantations
  alter column area set not null,
  add constraint plantations_area_check check (area > 0 and area <= 250000);
