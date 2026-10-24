-- Additive migration; existing movements keep their current prices and state.
alter table public.movimientos
  add column if not exists precios_completados_at timestamptz;
