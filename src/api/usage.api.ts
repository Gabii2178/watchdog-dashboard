import { request } from "./client";

export type UsageResponse = {
  success: boolean;
  usage: {
    monitors: {
      total: number;
      active: number;
      paused: number;
      error: number;
    };
    checks: {
      total: number;
      changed: number;
    };
    webhooks: {
      total: number;
      enabled: number;
    };
  };
};

export function getUsage(token: string): Promise<UsageResponse> {
  return request<UsageResponse>("/usage", { token });
}
