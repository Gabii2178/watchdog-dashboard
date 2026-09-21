import { createContext } from "react";
import type { LoginRequest, User } from "../api/auth.api";

export type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
