// Tipos de filas de la BD. Castear los resultados de las consultas a estos tipos
// da seguridad en compilación: si renombras una columna y el código la usa,
// TypeScript marca el error en vez de fallar silenciosamente en runtime.

export interface User {
  id: string;
  email: string | null;
  display_name: string | null;
  share_link: string;
  stars: number;
  streak_count: number;
  subscribed_until: string | null;
  boosted_until: string | null;
  referral_count: number;
  created_at: string;
}

// Fila de auth_providers unida al usuario (incluye el hash de la contraseña).
export type UserWithPasswordHash = User & { password_hash: string | null };
