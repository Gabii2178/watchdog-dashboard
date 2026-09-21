import { request, requestBlob } from "./client";

export type MonitorBackend = {
  id: number;
  url: string;
  status: string;
  checkInterval: number;
  changeThreshold: number;
  notificationCooldown: number;
  lastCheckedAt: string | null;
  createdAt: string | null;
};

export type CreateMonitorRequest = {
  url: string;
  checkInterval?: number;
  changeThreshold?: number;
  notificationCooldown?: number;
};

export type CreateMonitorResponse = {
  id: number;
  userId: number;
  url: string;
  status: string;
  checkInterval: number;
  changeThreshold: number;
  notificationCooldown: number;
};

export type MonitorActionResponse = {
  id: number;
  status: string;
  message?: string;
  nextCheckAt?: string;
};

export type MonitorCheckResponse = {
  id: number;
  monitorId: number;
  similarity: number;
  changed: boolean;
  createdAt: string;
  evidence?: {
    before: boolean;
    after: boolean;
    diff: boolean;
  };
};

export type MonitorChecksResponse = {
  data: MonitorCheckResponse[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
};

export type MonitorCheckEvidenceResponse = {
  checkId: number;
  monitorId: number;
  evidence: {
    before: string | null;
    after: string | null;
    diff: string | null;
  };
};

export function getMonitors(token?: string): Promise<MonitorBackend[]> {
  return request<MonitorBackend[]>("/monitors", { token });
}

export function getMonitor(id: number, token?: string): Promise<MonitorBackend> {
  return request<MonitorBackend>(`/monitors/${id}`, { token });
}

export function getMonitorChecks(id: number, token?: string): Promise<MonitorChecksResponse> {
  return request<MonitorChecksResponse>(`/monitors/${id}/checks`, { token });
}

export function getMonitorCheckEvidence(
  monitorId: number,
  checkId: number,
  token?: string,
): Promise<MonitorCheckEvidenceResponse> {
  return request<MonitorCheckEvidenceResponse>(
    `/monitors/${monitorId}/checks/${checkId}/evidence`,
    { token },
  );
}

export function getMonitorCheckEvidenceImage(
  monitorId: number,
  checkId: number,
  artifact: "before" | "after" | "diff",
  token?: string,
): Promise<Blob> {
  return requestBlob(
    `/monitors/${monitorId}/checks/${checkId}/evidence/${artifact}`,
    { token },
  );
}

export function createMonitor(payload: CreateMonitorRequest, token?: string): Promise<CreateMonitorResponse> {
  return request<CreateMonitorResponse>("/monitors", {
    method: "POST",
    body: payload,
    token,
  });
}

export function pauseMonitor(id: number, token?: string): Promise<MonitorActionResponse> {
  return request<MonitorActionResponse>(`/monitors/${id}/pause`, {
    method: "POST",
    token,
  });
}

export function resumeMonitor(id: number, token?: string): Promise<MonitorActionResponse> {
  return request<MonitorActionResponse>(`/monitors/${id}/resume`, {
    method: "POST",
    token,
  });
}

export function checkMonitorNow(id: number, token?: string): Promise<MonitorCheckResponse> {
  return request<MonitorCheckResponse>(`/monitors/${id}/check`, {
    method: "POST",
    token,
  });
}

export function deleteMonitor(id: number, token?: string): Promise<void> {
  return request<void>(`/monitors/${id}`, { method: "DELETE", token });
}
