-- Apply to your own Supabase project after reviewing it. No remote migration is run by the app.
begin;
create table if not exists public.viajes (
  id uuid primary key, owner_id uuid not null default auth.uid(),
  created_at timestamptz not null, updated_at timestamptz not null, deleted_at timestamptz, synced_at timestamptz,
  fecha_inicio date not null, fecha_fin date, estado text not null check (estado in ('ABIERTO','CERRADO')), nota text not null default ''
);
create table if not exists public.partes (
  id uuid primary key, owner_id uuid not null default auth.uid(),
  created_at timestamptz not null, updated_at timestamptz not null, deleted_at timestamptz, synced_at timestamptz,
  nombre text not null, nombre_norm text not null, roles text[] not null
);
create table if not exists public.movimientos (
  id uuid primary key, owner_id uuid not null default auth.uid(),
  created_at timestamptz not null, updated_at timestamptz not null, deleted_at timestamptz, synced_at timestamptz,
  viaje_id uuid not null, parte_id uuid not null, tipo text not null check (tipo in ('COMPRA','VENTA','FLETE')),
  fecha date not null, precios jsonb not null default '{}', tiene_pesos_compra boolean not null default true,
  estado text not null check (estado in ('EN_CURSO','TERMINADO')), legacy_id bigint, legacy_resumen jsonb
);
create table if not exists public.paquetes (
  id uuid primary key, owner_id uuid not null default auth.uid(),
  created_at timestamptz not null, updated_at timestamptz not null, deleted_at timestamptz, synced_at timestamptz,
  tipo text not null check (tipo in ('R','P','J')), peso_c integer not null check (peso_c > 0),
  granja_id uuid, compra_mov_id uuid, venta_mov_id uuid,
  estado text not null check (estado in ('EN_CAMION','EN_VENTA','VENDIDO')),
  origen text not null check (origen in ('COMPRA','VENTA_SIN_COMPRA')), orden_captura bigint not null, orden_venta bigint
);
create table if not exists public.flete_lineas (
  id uuid primary key, owner_id uuid not null default auth.uid(),
  created_at timestamptz not null, updated_at timestamptz not null, deleted_at timestamptz, synced_at timestamptz,
  movimiento_id uuid not null, tipo text not null check (tipo in ('R','P','J')), cantidad integer not null check (cantidad > 0)
);
create index if not exists movimientos_viaje on public.movimientos(owner_id, viaje_id);
create index if not exists movimientos_parte on public.movimientos(owner_id, parte_id);
create index if not exists paquetes_stock on public.paquetes(owner_id, estado, tipo, granja_id);
create index if not exists paquetes_compra on public.paquetes(owner_id, compra_mov_id);
create index if not exists paquetes_venta on public.paquetes(owner_id, venta_mov_id);
create index if not exists flete_movimiento on public.flete_lineas(owner_id, movimiento_id);
-- Composite tenant keys prevent a record from referencing another owner's data.
create unique index if not exists viajes_owner_id on public.viajes(owner_id, id);
create unique index if not exists partes_owner_id on public.partes(owner_id, id);
create unique index if not exists movimientos_owner_id on public.movimientos(owner_id, id);
alter table public.movimientos add constraint movimientos_viaje_owner foreign key (owner_id, viaje_id) references public.viajes(owner_id, id);
alter table public.movimientos add constraint movimientos_parte_owner foreign key (owner_id, parte_id) references public.partes(owner_id, id);
alter table public.paquetes add constraint paquetes_granja_owner foreign key (owner_id, granja_id) references public.partes(owner_id, id);
alter table public.paquetes add constraint paquetes_compra_owner foreign key (owner_id, compra_mov_id) references public.movimientos(owner_id, id);
alter table public.paquetes add constraint paquetes_venta_owner foreign key (owner_id, venta_mov_id) references public.movimientos(owner_id, id);
alter table public.flete_lineas add constraint flete_movimiento_owner foreign key (owner_id, movimiento_id) references public.movimientos(owner_id, id);
do $$
declare tabla text;
begin
  foreach tabla in array array['viajes','partes','movimientos','paquetes','flete_lineas'] loop
    execute format('alter table public.%I enable row level security', tabla);
    execute format('create policy propio_select on public.%I for select to authenticated using ((select auth.uid()) = owner_id)', tabla);
    execute format('create policy propio_insert on public.%I for insert to authenticated with check ((select auth.uid()) = owner_id)', tabla);
    execute format('create policy propio_update on public.%I for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id)', tabla);
    execute format('grant select, insert, update on public.%I to authenticated', tabla);
    execute format('revoke all on public.%I from anon', tabla);
  end loop;
end $$;
commit;
