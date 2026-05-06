import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const AUTH_USER_KEY = 'auth:user';

function loadStoredUser() {
  try {
    const raw = window.localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function storeUser(nextUser) {
  try {
    if (!nextUser) {
      window.localStorage.removeItem(AUTH_USER_KEY);
      return;
    }
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
  } catch {
    // ignore
  }
}

function clearAuthStorage() {
  const candidates = [
    'token',
    'authToken',
    'accessToken',
    'access_token',
    'jwt',
    'user',
    'currentUser',
    'auth',
    'auth:user',
    'auth:token',
  ];

  try {
    candidates.forEach((key) => window.localStorage.removeItem(key));
    window.localStorage.removeItem('persist:root');
  } catch {
    // ignore (storage may be unavailable)
  }

  try {
    candidates.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // ignore (storage may be unavailable)
  }
}

function clearAuthCookies() {
  // Best effort: cannot clear HttpOnly cookies from JS.
  const cookieNames = [
    'token',
    'auth',
    'jwt',
    'access_token',
    'accessToken',
    'refresh_token',
    'refreshToken',
    'session',
  ];

  cookieNames.forEach((name) => {
    try {
      document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; path=/`;
      document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; path=/; SameSite=Lax`;
    } catch {
      // ignore
    }
  });
}

async function bestEffortBackendLogout() {
  const candidates = ['/auth/logout', '/auth/logout/'];

  await Promise.allSettled(
    candidates.map((path) =>
      fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'}${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
    )
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadStoredUser());

  useEffect(() => {
    // Defensive re-hydration: if something resets in-memory state but storage still
    // has a valid session, restore it to avoid surprise redirects.
    if (user) return;
    const stored = loadStoredUser();
    if (stored) setUser(stored);
  }, [user]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== AUTH_USER_KEY) return;
      const stored = loadStoredUser();
      setUser(stored);
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login: (nextUser) => {
        storeUser(nextUser);
        setUser(nextUser);
      },
      logout: async () => {
        // Do not depend on a backend: clear frontend state first.
        clearAuthStorage();
        clearAuthCookies();
        storeUser(null);
        setUser(null);

        // If a backend logout exists, call it, but never block sign-out on it.
        try {
          await bestEffortBackendLogout();
        } catch {
          // ignore
        }
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
