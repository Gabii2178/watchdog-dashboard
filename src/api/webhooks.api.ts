import { request } from "./client";

export type WebhookBackend = {
  id: number;
  monitorId: number;
  url: string;
  enabled: boolean;
  createdAt: string;
};

export type GetWebhooksResponse = {
  success: boolean;
  count: number;
  webhooks: WebhookBackend[];
};

export type CreateWebhookRequest = {
  url: string;
};

export type CreateWebhookResponse = {
  success: boolean;
  webhook: {
    id: number;
    monitorId: number;
    url: string;
    secret: string;
    enabled: boolean;
  };
};

export type UpdateWebhookRequest = {
  enabled: boolean;
};

export type UpdateWebhookResponse = {
  success: boolean;
  webhook: {
    id: number;
    monitorId: number;
    url: string;
    enabled: boolean;
    createdAt: string;
  };
};

export type DeleteWebhookResponse = {
  success: boolean;
  message: string;
};

export function getWebhooks(monitorId: number, token?: string): Promise<GetWebhooksResponse> {
  return request<GetWebhooksResponse>(`/monitors/${monitorId}/webhooks`, { token });
}

export function createWebhook(monitorId: number, payload: CreateWebhookRequest, token?: string): Promise<CreateWebhookResponse> {
  return request<CreateWebhookResponse>(`/monitors/${monitorId}/webhooks`, {
    method: "POST",
    body: payload,
    token,
  });
}

export function updateWebhook(
  monitorId: number,
  webhookId: number,
  payload: UpdateWebhookRequest,
  token?: string,
): Promise<UpdateWebhookResponse> {
  return request<UpdateWebhookResponse>(`/monitors/${monitorId}/webhooks/${webhookId}`, {
    method: "PATCH",
    body: payload,
    token,
  });
}

export function deleteWebhook(monitorId: number, webhookId: number, token?: string): Promise<DeleteWebhookResponse> {
  return request<DeleteWebhookResponse>(`/monitors/${monitorId}/webhooks/${webhookId}`, {
    method: "DELETE",
    token,
  });
}
