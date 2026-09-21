import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../../api/client";
import {
  createWebhook,
  deleteWebhook,
  getWebhooks,
  updateWebhook,
  type WebhookBackend,
} from "../../api/webhooks.api";
import { useAuth } from "../../auth/useAuth";
import Button from "../../components/Button";
import Icon from "../../components/Icon";

function getFriendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof TypeError) {
    return "Unable to reach WatchDog. Please try again.";
  }

  return "Something went wrong while loading your webhooks.";
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function WebhooksPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const monitorId = Number(id);

  const [webhooks, setWebhooks] = useState<WebhookBackend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [pendingAction, setPendingAction] = useState<{ id: number; action: "toggle" | "delete" } | null>(null);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  const loadWebhooks = useCallback(async () => {
    if (!Number.isFinite(monitorId) || monitorId <= 0) {
      setWebhooks([]);
      setErrorMessage("Monitor not found.");
      setIsLoading(false);
      return;
    }

    if (!token) {
      setWebhooks([]);
      setErrorMessage("Your session is no longer valid. Please sign in again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await getWebhooks(monitorId, token);
      setWebhooks(response.webhooks);
    } catch (error: unknown) {
      setErrorMessage(getFriendlyError(error));
    } finally {
      setIsLoading(false);
    }
  }, [monitorId, token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadWebhooks();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadWebhooks]);

  const handleCreateWebhook = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setFormError("Your session is no longer valid. Please sign in again.");
      return;
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setFormError("Enter a webhook URL.");
      return;
    }

    try {
      const parsed = new URL(trimmedUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("Unsupported protocol");
      }
    } catch {
      setFormError("Enter a valid http or https URL.");
      return;
    }

    try {
      const response = await createWebhook(monitorId, { url: trimmedUrl }, token);
      setCreatedSecret(response.webhook.secret);
      setUrl("");
      setFormError("");
      setIsFormOpen(false);
      await loadWebhooks();
    } catch (error: unknown) {
      setFormError(getFriendlyError(error));
    }
  };

  const handleToggleWebhook = async (webhook: WebhookBackend) => {
    if (!token) {
      setErrorMessage("Your session is no longer valid. Please sign in again.");
      return;
    }

    setPendingAction({ id: webhook.id, action: "toggle" });

    try {
      const response = await updateWebhook(monitorId, webhook.id, { enabled: !webhook.enabled }, token);
      setWebhooks((current) =>
        current.map((item) => (item.id === webhook.id ? { ...item, enabled: response.webhook.enabled } : item)),
      );
      setErrorMessage("");
    } catch (error: unknown) {
      setErrorMessage(getFriendlyError(error));
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeleteWebhook = async (webhook: WebhookBackend) => {
    if (!token) {
      setErrorMessage("Your session is no longer valid. Please sign in again.");
      return;
    }

    const confirmed = window.confirm(`Delete this webhook for ${webhook.url}?`);
    if (!confirmed) {
      return;
    }

    setPendingAction({ id: webhook.id, action: "delete" });

    try {
      await deleteWebhook(monitorId, webhook.id, token);
      setWebhooks((current) => current.filter((item) => item.id !== webhook.id));
      setErrorMessage("");
    } catch (error: unknown) {
      setErrorMessage(getFriendlyError(error));
    } finally {
      setPendingAction(null);
    }
  };

  const copySecret = async () => {
    if (!createdSecret) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createdSecret);
    } catch {
      // Clipboard access is optional; do not block the UI.
    }
  };

  if (!Number.isFinite(monitorId) || monitorId <= 0) {
    return (
      <>
        <div className="page-header">
          <div>
            <p className="eyebrow">Integrations</p>
            <h1 className="page-title">Webhooks</h1>
            <p className="page-description">Send monitor events to your integrations.</p>
          </div>
        </div>
        <section className="card">
          <div className="empty-state">
            <div>
              <div className="empty-icon" aria-hidden="true">!</div>
              <strong>Monitor not found</strong>
              <p>We could not find the selected monitor.</p>
              <Link to="/monitors">
                <Button variant="secondary">Back to monitors</Button>
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Integrations / Monitor {monitorId}</p>
          <h1 className="page-title">Webhooks</h1>
          <p className="page-description">Send monitor events to the tools your team already uses.</p>
        </div>
        <Button icon={<Icon name="plus" size={16} />} onClick={() => setIsFormOpen((current) => !current)}>
          {isFormOpen ? "Close" : "Add webhook"}
        </Button>
      </div>

      {createdSecret && (
        <section className="card webhook-secret-card" aria-live="polite">
          <div className="webhook-secret-banner">
            <div>
              <strong>Webhook secret created</strong>
              <p>Copy this value now. It is only shown once and will not be available later.</p>
            </div>
            <div className="webhook-secret-box">
              <code>{createdSecret}</code>
              <Button type="button" variant="secondary" onClick={() => void copySecret()}>
                Copy
              </Button>
            </div>
          </div>
        </section>
      )}

      {isFormOpen && (
        <section className="card webhook-form-card" aria-label="Create webhook form">
          <form className="webhook-form" onSubmit={handleCreateWebhook} noValidate>
            <div className="form-field webhook-form-field">
              <label htmlFor="webhook-url">Webhook URL</label>
              <input
                id="webhook-url"
                type="url"
                value={url}
                placeholder="https://example.com/webhook"
                onChange={(event) => setUrl(event.target.value)}
                aria-invalid={Boolean(formError)}
              />
            </div>
            <div className="webhook-form-actions">
              <Button type="button" variant="secondary" onClick={() => {
                setUrl("");
                setFormError("");
                setIsFormOpen(false);
              }}>
                Cancel
              </Button>
              <Button type="submit">Create webhook</Button>
            </div>
            {formError && <p className="field-error webhook-form-error" role="alert">{formError}</p>}
          </form>
        </section>
      )}

      {isLoading ? (
        <section className="card" aria-live="polite" aria-label="Loading webhooks">
          <div className="monitor-skeleton">
            <div className="monitor-skeleton-row wide" />
            <div className="monitor-skeleton-row" />
            <div className="monitor-skeleton-row" />
          </div>
        </section>
      ) : errorMessage ? (
        <section className="card" aria-live="polite">
          <div className="empty-state">
            <div>
              <div className="empty-icon" aria-hidden="true">!</div>
              <strong>Unable to load webhooks</strong>
              <p>{errorMessage}</p>
              <Button variant="secondary" onClick={() => void loadWebhooks()}>Retry</Button>
            </div>
          </div>
        </section>
      ) : webhooks.length === 0 ? (
        <section className="card">
          <div className="empty-state">
            <div>
              <div className="empty-icon" aria-hidden="true"><Icon name="webhook" size={20} /></div>
              <strong>No webhooks configured</strong>
              <p>Webhooks can notify your services when this monitor detects a change or an error.</p>
              <Button onClick={() => setIsFormOpen(true)}>Add your first webhook</Button>
            </div>
          </div>
        </section>
      ) : (
        <section className="card webhook-list" aria-label="Webhooks">
          {webhooks.map((webhook) => (
            <div className="webhook-row" key={webhook.id}>
              <div className="webhook-info">
                <strong className="webhook-url">{webhook.url}</strong>
                <span className="webhook-meta">Created {formatDate(webhook.createdAt)}</span>
              </div>
              <span className={`status-badge ${webhook.enabled ? "status-healthy" : "status-neutral"}`}>
                <span className="status-dot" aria-hidden="true" />
                {webhook.enabled ? "Enabled" : "Disabled"}
              </span>
              <div className="webhook-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void handleToggleWebhook(webhook)}
                  disabled={Boolean(pendingAction && pendingAction.id === webhook.id)}
                >
                  {pendingAction && pendingAction.id === webhook.id && pendingAction.action === "toggle"
                    ? "Updating..."
                    : webhook.enabled
                      ? "Disable"
                      : "Enable"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void handleDeleteWebhook(webhook)}
                  disabled={Boolean(pendingAction && pendingAction.id === webhook.id)}
                >
                  {pendingAction && pendingAction.id === webhook.id && pendingAction.action === "delete"
                    ? "Deleting..."
                    : "Delete"}
                </Button>
              </div>
            </div>
          ))}
        </section>
      )}
    </>
  );
}

export default WebhooksPage;