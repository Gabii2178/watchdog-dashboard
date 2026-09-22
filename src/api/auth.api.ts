import { request } from "./client";

export type User = {
  id: number;
  email: string;
  created_at: string;
  email_notifications_enabled?: boolean;
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
  user: User & { email_notifications_enabled: boolean };
};

export type UpdateNotificationPreferenceResponse = {
  success: boolean;
  email_notifications_enabled: boolean;
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

export function updateEmailNotifications(
  token: string,
  enabled: boolean,
): Promise<UpdateNotificationPreferenceResponse> {
  return request<UpdateNotificationPreferenceResponse>("/auth/me", {
    method: "PATCH",
    token,
    body: {
      email_notifications_enabled: enabled,
    },
  });
}
