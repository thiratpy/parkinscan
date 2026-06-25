"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthChange } from "../../lib/auth";

const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
});

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let unsubscribe = null;
    let isMounted = true;

    async function initAuth() {
      try {
        unsubscribe = await onAuthChange((user) => {
          if (isMounted) setState({ user, loading: false, error: null });
        });
      } catch (e) {
        if (isMounted) setState({ user: null, loading: false, error: e });
      }
    }

    initAuth();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
