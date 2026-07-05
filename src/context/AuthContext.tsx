import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import * as api from '../lib/api';
import { clearStoredAuth, getStoredAuth, setStoredAuth, type StoredUser } from '../lib/auth-storage';
import { withColdStartNotice } from '../lib/cold-start-notice';

type AuthStatus = 'loading' | 'guest' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: StoredUser | null;
  bestScore: number | null;
  gamesPlayed: number;
  signUp: (username: string, password: string) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
  continueAsGuest: () => void;
  saveScore: (payload: api.GameResultPayload) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [gamesPlayed, setGamesPlayed] = useState(0);

  const applyAuth = useCallback((auth: { token: string; user: StoredUser }) => {
    setStoredAuth(auth);
    setToken(auth.token);
    setUser(auth.user);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(() => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
    setBestScore(null);
    setGamesPlayed(0);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    const stored = getStoredAuth();
    if (!stored) {
      setStatus('unauthenticated');
      return;
    }

    // Optimistic: trust the stored token immediately, then validate in the background.
    setToken(stored.token);
    setUser(stored.user);
    setStatus('authenticated');

    api
      .fetchMe(stored.token)
      .then((me) => {
        setBestScore(me.bestScore);
        setGamesPlayed(me.gamesPlayed);
      })
      .catch(() => {
        clearStoredAuth();
        setToken(null);
        setUser(null);
        setStatus('unauthenticated');
      });
  }, []);

  const signUp = useCallback(async (username: string, password: string) => {
    const auth = await withColdStartNotice(api.signUp(username, password));
    applyAuth(auth);
  }, [applyAuth]);

  const signIn = useCallback(async (username: string, password: string) => {
    const auth = await withColdStartNotice(api.signIn(username, password));
    applyAuth(auth);
    const me = await api.fetchMe(auth.token);
    setBestScore(me.bestScore);
    setGamesPlayed(me.gamesPlayed);
  }, [applyAuth]);

  const continueAsGuest = useCallback(() => {
    setStatus('guest');
  }, []);

  const saveScore = useCallback(async (payload: api.GameResultPayload) => {
    if (!token) return;
    try {
      const summary = await api.postScore(token, payload);
      setBestScore(summary.bestScore);
      setGamesPlayed(summary.gamesPlayed);
    } catch (err) {
      if (err instanceof api.ApiError && err.status === 401) {
        signOut();
      }
      throw err;
    }
  }, [token, signOut]);

  return (
    <AuthContext.Provider
      value={{ status, user, bestScore, gamesPlayed, signUp, signIn, signOut, continueAsGuest, saveScore }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
