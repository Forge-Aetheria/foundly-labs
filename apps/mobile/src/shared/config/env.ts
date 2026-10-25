function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value.trim();
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export const env = {
  apiUrl: required('EXPO_PUBLIC_API_URL').replace(/\/+$/, ''),
  supabaseUrl: required('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: required('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  easProjectId: optional('EXPO_PUBLIC_EAS_PROJECT_ID'),
  bookUrl: optional('EXPO_PUBLIC_BOOK_URL')?.replace(/\/+$/, ''),
} as const;
