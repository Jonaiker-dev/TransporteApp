import { defineStore, acceptHMRUpdate } from 'pinia';
import type {
  UserWithoutPassword,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
} from '@/modulos/login/types';
import { loginWithDexie, registerWithDexie, restaurarSesion } from '@/modulos/login/api';

import { salirRespaldo } from '@/sync/supabase';
const STORAGE_KEY = 'transporte_ksm_auth_user';

interface AuthState {
  user: UserWithoutPassword | null;
  isLoading: boolean;
  error: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => {
    let initialUser: UserWithoutPassword | null = null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        initialUser = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('No se pudo restaurar la sesión desde localStorage:', e);
    }

    return {
      user: initialUser,
      isLoading: false,
      error: null,
    };
  },

  getters: {
    isAuthenticated: (state): boolean => !!state.user,
    currentUser: (state): UserWithoutPassword | null => state.user,
    userName: (state): string => state.user?.nombre ?? 'Usuario',
    userEmail: (state): string => state.user?.email ?? '',
    userRole: (state): string => state.user?.rol ?? 'usuario',
  },

  actions: {
    /**
     * Guarda el usuario logueado en memoria y lo persiste en localStorage
     */
    setUser(user: UserWithoutPassword | null) {
      this.user = user;
      try {
        if (user) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.warn('Error al persistir usuario en localStorage:', e);
      }
    },

    /**
     * Inicia sesión validando contra Dexie y guardando el usuario en Pinia
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await loginWithDexie(credentials);
        if (response.success && response.user) {
          this.setUser(response.user);
        } else {
          this.error = response.message;
        }
        return response;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Ocurrió un error inesperado al iniciar sesión';
        this.error = message;
        return { success: false, message };
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Registra un nuevo usuario en Dexie y lo loguea en Pinia
     */
    async register(data: RegisterCredentials): Promise<AuthResponse> {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await registerWithDexie(data);
        if (response.success && response.user) {
          this.setUser(response.user);
        } else {
          this.error = response.message;
        }
        return response;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Ocurrió un error inesperado al registrar usuario';
        this.error = message;
        return { success: false, message };
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Cierra la sesión activa y limpia Pinia y localStorage
     */
    async logout() {
      await salirRespaldo();
      this.setUser(null);
      this.error = null;
    },

    /**
     * Inicializa semillas o revisa estado
     */
    async init() {
      this.setUser(await restaurarSesion());
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
