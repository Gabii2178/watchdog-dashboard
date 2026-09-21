import { request } from "./client";

export type User = {
  id: number;
  email: string;
  created_at: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
};

export type RegisterResponse = {
  success: boolean;
  message: string;
  user: User;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  token: string;
  expiresIn: string;
  user: User;
};

export type CurrentUserResponse = {
  success: boolean;
  user: User;
};

export function registerUser(credentials: RegisterRequest): Promise<RegisterResponse> {
  return request<RegisterResponse>("/auth/register", {
    method: "POST",
    body: credentials,
  });
}

export function loginUser(credentials: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: credentials,
  });
}

export function getCurrentUser(token: string): Promise<CurrentUserResponse> {
  return request<CurrentUserResponse>("/auth/me", { token });
}
