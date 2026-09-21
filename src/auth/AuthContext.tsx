import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getCurrentUser, loginUser } from "../api/auth.api";
import type { User } from "../api/auth.api";
import { ApiError } from "../api/client";
import { clearAccessToken, getAccessToken, setAccessToken } from "./auth.storage";
import { AuthContext } from "./auth.context";
import type { AuthContextValue } from "./auth.context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => getAccessToken());
  const [isLoading, setIsLoading] = useState(() => getAccessToken() !== null);

  useEffect(() => {
    const storedToken = getAccessToken();
    if (!storedToken) {
      return;
    }

    getCurrentUser(storedToken)
      .then((response) => {
        setToken(storedToken);
        setUser(response.user);
      })
      .catch((error: unknown) => {
        clearAccessToken();
        setToken(null);
        setUser(null);
        if (error instanceof ApiError && error.status === 401) {
          return;
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isLoading,
    async login(credentials) {
      const response = await loginUser(credentials);
      setAccessToken(response.token);
      setToken(response.token);
      setUser(response.user);
    },
    logout() {
      clearAccessToken();
      setToken(null);
      setUser(null);
    },
  }), [isLoading, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
