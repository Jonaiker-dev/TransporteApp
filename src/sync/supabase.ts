import type { SupabaseClient } from '@supabase/supabase-js';
import { reactive } from 'vue';
import { procesarCola } from './engine';
import { siguienteReintento, vincularPropietario } from '../repositories/respaldo';
const url = import.meta.env.SUPABASE_URL ?? '';
const anon = import.meta.env.SUPABASE_ANON_KEY ?? '';
let clientPromise: Promise<SupabaseClient | null> | null = null;
export const syncState = reactive({
  running: false,
  authenticated: false,
  error:
    url && anon
      ? ''
      : 'Configura el respaldo para enviar los cambios. Tus datos siguen guardados en este dispositivo.',
  configured: Boolean(url && anon),
});
export async function clienteRespaldo(): Promise<SupabaseClient | null> {
  if (!url || !anon) return null;
  clientPromise ??= import('@supabase/supabase-js')
    .then(({ createClient }) =>
      createClient(url, anon, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      }),
    )
    .catch(() => {
      clientPromise = null;
      syncState.error =
        'No se pudo cargar el respaldo. Comprueba su configuración; puedes seguir trabajando localmente.';
      return null;
    });
  return clientPromise;
}
let timer: ReturnType<typeof setTimeout> | undefined;
let started = false;
export async function sincronizar(): Promise<void> {
  if (syncState.running) return;
  clearTimeout(timer);
  const supabase = await clienteRespaldo();
  if (!supabase) {
    syncState.error =
      'Configura el respaldo para enviar los cambios. Tus datos siguen guardados en este dispositivo.';
    return;
  }
  if (!navigator.onLine) {
    syncState.error = 'Sin conexión. Tus cambios siguen guardados en este dispositivo.';
    return;
  }
  syncState.running = true;
  syncState.error = '';
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      syncState.authenticated = false;
      syncState.error = 'Inicia sesión para respaldar. Puedes seguir trabajando sin conexión.';
      return;
    }
    syncState.authenticated = true;
    await procesarCola(data.session.user.id, async (tabla, rows) => {
      const response = await supabase.from(tabla).upsert(rows, { onConflict: 'id' });
      if (response.error)
        throw new Error(
          'El servidor no confirmó el respaldo. Comprueba tu sesión y la configuración.',
        );
    });
  } catch (err) {
    syncState.error =
      err instanceof Error
        ? err.message
        : 'No se pudo respaldar. Los cambios siguen en el dispositivo.';
  } finally {
    syncState.running = false;
    const next = await siguienteReintento().catch(() => null);
    if (next !== null)
      timer = setTimeout(
        () => {
          void sincronizar();
        },
        Math.max(5000, next - Date.now()),
      );
  }
}
export async function iniciarRespaldo() {
  if (started) return;
  started = true;
  window.addEventListener('online', () => {
    void sincronizar();
  });
  const supabase = await clienteRespaldo();
  supabase?.auth.onAuthStateChange((_event, session) => {
    syncState.authenticated = Boolean(session);
    if (session)
      setTimeout(() => {
        void sincronizar();
      }, 0);
  });
  // Periodic scheduling also picks up changes made while the app remains online.
  timer = setTimeout(() => {
    void sincronizar();
  }, 1000);
}
export async function entrarRespaldo(email: string, password: string) {
  const supabase = await clienteRespaldo();
  if (!supabase)
    throw new Error('El respaldo aún no está configurado. Puedes continuar sin sesión.');
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.user)
    throw new Error('No se pudo iniciar sesión. Comprueba el correo, la contraseña y tu conexión.');
  try {
    await vincularPropietario(data.user.id);
  } catch (err) {
    await supabase.auth.signOut();
    throw err;
  }
  return data.user;
}
export async function registrarRespaldo(nombre: string, email: string, password: string) {
  const supabase = await clienteRespaldo();
  if (!supabase) throw new Error('Configura Supabase para crear una cuenta de respaldo.');
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { nombre } },
  });
  if (error || !data.user)
    throw new Error('No se pudo registrar la cuenta. Verifica tus datos y tu conexión.');
  if (!data.session) throw new Error('Cuenta creada. Confirma tu correo y luego inicia sesión.');
  await vincularPropietario(data.user.id);
  return data.user;
}
export async function salirRespaldo() {
  clearTimeout(timer);
  await (await clienteRespaldo())?.auth.signOut();
  syncState.authenticated = false;
}
