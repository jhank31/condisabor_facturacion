import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiClient } from '../lib/axios';
import { supabase } from '../lib/supabase';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const tokenRef = useRef(null);

  const fetchMe = useCallback(async (token) => {
    try {
      const res = await apiClient.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch {
      return null;
    }
  }, []);

  const setSession = useCallback(
    async (supabaseSession) => {
      if (!supabaseSession) {
        setUser(null);
        setAccessToken(null);
        tokenRef.current = null;
        return;
      }
      const { access_token } = supabaseSession;
      tokenRef.current = access_token;
      setAccessToken(access_token);
      const me = await fetchMe(access_token);
      if (me) {
        setUser({ ...me, accessToken: access_token });
      }
    },
    [fetchMe]
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session).finally(() => setLoading(false));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        tokenRef.current = session.access_token;
        setAccessToken(session.access_token);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [setSession]);

  const login = useCallback(
    async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await setSession(data.session);
      navigate('/dashboard');
    },
    [setSession, navigate]
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
    tokenRef.current = null;
    navigate('/login');
    toast.success('Sesión cerrada correctamente');
  }, [navigate]);

  const getToken = useCallback(() => tokenRef.current, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}
