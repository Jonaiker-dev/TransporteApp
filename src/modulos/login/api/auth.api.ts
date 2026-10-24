import { entrarRespaldo, registrarRespaldo, clienteRespaldo } from '@/sync/supabase';
import type { User } from '@supabase/supabase-js';
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  UserWithoutPassword,
} from '../types';
export function usuarioRespaldo(user: User): UserWithoutPassword {
  return {
    id: user.id,
    nombre:
      typeof user.user_metadata.nombre === 'string'
        ? user.user_metadata.nombre
        : (user.email?.split('@')[0] ?? 'Conductor'),
    email: user.email ?? '',
    rol: 'conductor',
    createdAt: Date.parse(user.created_at),
  };
}
// Kept as a compatibility entry point; no demo credentials are generated.
export function seedDefaultUserIfEmpty(): Promise<void> {
  return Promise.resolve();
}
export async function loginWithDexie(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const user = await entrarRespaldo(credentials.email, credentials.password);
    return { success: true, message: 'Respaldo conectado.', user: usuarioRespaldo(user) };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'No se pudo iniciar sesión.',
    };
  }
}
export async function registerWithDexie(data: RegisterCredentials): Promise<AuthResponse> {
  try {
    const user = await registrarRespaldo(data.nombre.trim(), data.email, data.password);
    return { success: true, message: 'Cuenta creada.', user: usuarioRespaldo(user) };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'No se pudo registrar.',
    };
  }
}
export async function restaurarSesion(): Promise<UserWithoutPassword | null> {
  const supabase = await clienteRespaldo();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ? usuarioRespaldo(data.session.user) : null;
}
