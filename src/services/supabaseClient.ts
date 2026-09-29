import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Local storage keys
const STORAGE_KEY_URL = 'rh_supabase_url';
const STORAGE_KEY_KEY = 'rh_supabase_anon_key';

const DEFAULT_URL = 'https://ankpxeyohrvzqjezsvno.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua3B4ZXlvaHJ2enFqZXpzdm5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNjk4MjQsImV4cCI6MjEwNTg0NTgyNH0.01bqKxcnT6TKHuAC1OcGwIQKZ0gMTNjptoRWpd4BwDw';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const storedUrl = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) || '' : '').trim();
  const storedKey = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) || '' : '').trim();

  const url = storedUrl || (envUrl && !envUrl.includes('seu-projeto') ? envUrl : DEFAULT_URL);
  const anonKey = storedKey || (envKey && !envKey.includes('sua-chave') ? envKey : DEFAULT_ANON_KEY);

  return { url, anonKey };
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
    else localStorage.removeItem(STORAGE_KEY_URL);

    if (anonKey) localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
    else localStorage.removeItem(STORAGE_KEY_KEY);
  }
}

let cachedClient: SupabaseClient | null = null;
let currentConfigString = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();

  // Basic check for valid supabase URL format
  if (!url || !anonKey || !url.startsWith('https://') || !url.includes('.supabase.co')) {
    return null;
  }

  const configString = `${url}:${anonKey}`;
  if (cachedClient && currentConfigString === configString) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    currentConfigString = configString;
    return cachedClient;
  } catch (error) {
    console.warn('Erro ao inicializar cliente Supabase:', error);
    return null;
  }
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL e Chave Anônima são obrigatórias.' };
  }

  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    return { success: false, message: 'A URL do Supabase deve iniciar com https:// e conter .supabase.co' };
  }

  try {
    const testClient = createClient(url, anonKey);
    // Attempt a light query to verify credentials
    const { error } = await testClient.from('funcionarios').select('id').limit(1);

    // If table doesn't exist yet, it's still a valid connection!
    if (error && error.code === '42P01') {
      return {
        success: true,
        message: 'Conectado com sucesso ao Supabase! As tabelas ainda não foram criadas. Copie e execute o Script SQL fornecido abaixo no SQL Editor do Supabase.',
      };
    }

    if (error && error.message) {
      if (error.message.includes('API key') || error.message.includes('JWT') || error.code === 'PGRST301') {
        return { success: false, message: 'Chave de API anônima inválida ou expirada.' };
      }
      return { success: true, message: `Conexão autenticada! (${error.message})` };
    }

    return { success: true, message: 'Conexão com o Supabase estabelecida e testada com sucesso!' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha na comunicação de rede com o Supabase';
    return { success: false, message };
  }
}
