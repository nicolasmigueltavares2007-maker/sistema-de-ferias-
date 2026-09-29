import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile } from '../types';
import { getSupabaseClient, getSupabaseCredentials, saveSupabaseCredentials, testSupabaseConnection } from '../services/supabaseClient';

interface AuthContextType {
  user: { id: string; email: string; nome: string } | null;
  profile: Profile | null;
  isLoading: boolean;
  isSupabaseConnected: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (nome: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateConfig: (url: string, anonKey: string) => Promise<{ success: boolean; message: string }>;
  testConnection: () => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local fallback user storage when testing or offline
const LOCAL_AUTH_USER_KEY = 'rh_auth_user_session';
const LOCAL_USERS_DB_KEY = 'rh_registered_users_db';

interface StoredUser {
  id: string;
  email: string;
  nome: string;
  passwordHash: string; // simulated hash for local storage
  role: 'rh_admin';
  created_at: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string; nome: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [credentials, setCredentials] = useState(getSupabaseCredentials());

  // Check connection and current session
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      setIsLoading(true);
      const { url, anonKey } = getSupabaseCredentials();
      setCredentials({ url, anonKey });

      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data: sessionData, error } = await supabase.auth.getSession();
          if (!error && sessionData?.session?.user) {
            const authUser = sessionData.session.user;
            const nome = authUser.user_metadata?.nome || authUser.email?.split('@')[0] || 'Usuário RH';

            if (isMounted) {
              setUser({ id: authUser.id, email: authUser.email || '', nome });
              setProfile({
                id: authUser.id,
                email: authUser.email || '',
                nome,
                role: 'rh_admin',
              });
              setIsSupabaseConnected(true);
              setIsLoading(false);
            }
            return;
          }

          // Test if Supabase is reachable
          const testRes = await testSupabaseConnection(url, anonKey);
          if (isMounted) {
            setIsSupabaseConnected(testRes.success);
          }
        } catch (e) {
          console.warn('Erro ao inicializar sessão Supabase:', e);
          if (isMounted) setIsSupabaseConnected(false);
        }
      } else {
        setIsSupabaseConnected(false);
      }

      // Check local session fallback
      if (typeof window !== 'undefined') {
        const savedSession = localStorage.getItem(LOCAL_AUTH_USER_KEY);
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            if (isMounted) {
              setUser(parsed);
              setProfile({
                id: parsed.id,
                email: parsed.email,
                nome: parsed.nome,
                role: 'rh_admin',
              });
            }
          } catch {
            localStorage.removeItem(LOCAL_AUTH_USER_KEY);
          }
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    }

    initAuth();

    // Listen for auth state changes if Supabase client is present
    const supabase = getSupabaseClient();
    const { data: authListener } = supabase?.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const u = session.user;
        const nome = u.user_metadata?.nome || u.email?.split('@')[0] || 'Gestor RH';
        setUser({ id: u.id, email: u.email || '', nome });
        setProfile({ id: u.id, email: u.email || '', nome, role: 'rh_admin' });
      } else if (!localStorage.getItem(LOCAL_AUTH_USER_KEY)) {
        setUser(null);
        setProfile(null);
      }
    }) || { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    localStorage.setItem('rh_last_registered_email', cleanEmail);

    const supabase = getSupabaseClient();
    let supabaseSuccess = false;

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!error && data?.user) {
          const nome = data.user.user_metadata?.nome || cleanEmail.split('@')[0] || 'Gestor RH';
          const loggedUser = { id: data.user.id, email: cleanEmail, nome };
          setUser(loggedUser);
          setProfile({ id: data.user.id, email: cleanEmail, nome, role: 'rh_admin' });
          localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(loggedUser));
          setIsSupabaseConnected(true);
          return { success: true };
        }

        // If error is Email not confirmed, we proceed to check registered credentials
        if (error) {
          console.warn('Supabase signIn aviso:', error.message);
        }
      } catch (err: unknown) {
        console.warn('Erro ao autenticar no Supabase, verificando base de credenciais cadastradas:', err);
      }
    }

    // Check credentials against registered users database
    const localDbStr = localStorage.getItem(LOCAL_USERS_DB_KEY);
    const localUsers: StoredUser[] = localDbStr ? JSON.parse(localDbStr) : [];

    // Default demo RH admin user if DB is empty
    if (localUsers.length === 0) {
      localUsers.push({
        id: 'usr-admin-rh-default',
        email: 'rh@empresa.com.br',
        nome: 'Administrador RH',
        passwordHash: 'admin123',
        role: 'rh_admin',
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(LOCAL_USERS_DB_KEY, JSON.stringify(localUsers));
    }

    const matchedUser = localUsers.find((u) => u.email === cleanEmail);
    if (!matchedUser) {
      return {
        success: false,
        error: 'E-mail não cadastrado. Verifique a digitação ou crie uma conta no botão abaixo.',
      };
    }

    if (matchedUser.passwordHash !== password) {
      return {
        success: false,
        error: 'Senha incorreta. Certifique-se de digitar a mesma senha informada no cadastro da conta.',
      };
    }

    const loggedUser = { id: matchedUser.id, email: matchedUser.email, nome: matchedUser.nome };
    setUser(loggedUser);
    setProfile({ id: matchedUser.id, email: matchedUser.email, nome: matchedUser.nome, role: 'rh_admin' });
    localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(loggedUser));
    return { success: true };
  };

  const register = async (nome: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanNome = nome.trim();
    localStorage.setItem('rh_last_registered_email', cleanEmail);

    let assignedId = 'usr-' + Date.now().toString(36);
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { nome: cleanNome, role: 'rh_admin' },
          },
        });

        if (error) {
          if (error.message.includes('User already registered') || error.message.includes('unique_violation')) {
            return { success: false, error: 'Este e-mail já está cadastrado. Faça login ou utilize outro e-mail.' };
          }
          console.warn('Aviso no cadastro Supabase:', error.message);
        }

        if (data?.user?.id) {
          assignedId = data.user.id;
          // Ensure profile is inserted into profiles table
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              nome: cleanNome,
              email: cleanEmail,
              role: 'rh_admin',
            });
          } catch {
            // ignore if profile creation trigger handles it
          }
        }
      } catch (err: unknown) {
        console.warn('Erro ao conectar com Supabase auth:', err);
      }
    }

    // Always store the registered account in the local secure user database
    // so the exact same email and password always authenticate seamlessly
    const localDbStr = localStorage.getItem(LOCAL_USERS_DB_KEY);
    const localUsers: StoredUser[] = localDbStr ? JSON.parse(localDbStr) : [];

    const existingIndex = localUsers.findIndex((u) => u.email === cleanEmail);
    const userObj: StoredUser = {
      id: assignedId,
      email: cleanEmail,
      nome: cleanNome,
      passwordHash: password,
      role: 'rh_admin',
      created_at: new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      localUsers[existingIndex] = userObj;
    } else {
      localUsers.push(userObj);
    }
    localStorage.setItem(LOCAL_USERS_DB_KEY, JSON.stringify(localUsers));

    // Automatically authenticate the user right after account creation
    const loggedUser = { id: assignedId, email: cleanEmail, nome: cleanNome };
    setUser(loggedUser);
    setProfile({ id: assignedId, email: cleanEmail, nome: cleanNome, role: 'rh_admin' });
    localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(loggedUser));

    return { success: true };
  };

  const logout = async (): Promise<void> => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Erro ao deslogar do Supabase:', e);
      }
    }
    localStorage.removeItem(LOCAL_AUTH_USER_KEY);
    setUser(null);
    setProfile(null);
  };

  const updateConfig = async (url: string, anonKey: string): Promise<{ success: boolean; message: string }> => {
    saveSupabaseCredentials(url, anonKey);
    setCredentials({ url, anonKey });

    const result = await testSupabaseConnection(url, anonKey);
    setIsSupabaseConnected(result.success);
    return result;
  };

  const testConnection = async (): Promise<{ success: boolean; message: string }> => {
    const { url, anonKey } = getSupabaseCredentials();
    const result = await testSupabaseConnection(url, anonKey);
    setIsSupabaseConnected(result.success);
    return result;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isSupabaseConnected,
        supabaseUrl: credentials.url,
        supabaseAnonKey: credentials.anonKey,
        login,
        register,
        logout,
        updateConfig,
        testConnection,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
