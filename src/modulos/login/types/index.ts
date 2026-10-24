export type UserRole = 'conductor' | 'administrador' | 'cliente' | 'usuario';

export interface User {
  id?: number | string;
  nombre: string;
  email: string;
  telefono?: string;
  rol: UserRole;
  avatar?: string;
  createdAt: number;
  updatedAt?: number;
}

export type UserWithoutPassword = Omit<User, 'password'>;

export interface LoginCredentials {
  email: string;
  password: string;
  recordarme?: boolean;
}

export interface RegisterCredentials {
  nombre: string;
  email: string;
  password: string;
  confirmPassword?: string;
  telefono?: string;
  rol?: UserRole;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: UserWithoutPassword;
}
