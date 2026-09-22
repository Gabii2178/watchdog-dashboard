import { useCallback, useEffect, useState } from "react";
import { getCurrentUser, updateEmailNotifications } from "../api/auth.api";
import { ApiError } from "../api/client";
import { getUsage } from "../api/usage.api";
import type { UsageResponse } from "../api/usage.api";
import { useAuth } from "../auth/useAuth";
import { ErrorFeedback, SuccessFeedback } from "../components/Feedback";

function SettingsPage() {
  const { token, user } = useAuth();
  const hasUserPreference = typeof user?.email_notifications_enabled === "boolean";
  const [enabled, setEnabled] = useState<boolean | null>(
    user?.email_notifications_enabled ?? null,
  );
  const [isLoading, setIsLoading] = useState(token !== null && !hasUserPreference);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageResponse["usage"] | null>(null);
  const [isUsageLoading, setIsUsageLoading] = useState(token !== null);
  const [usageError, setUsageError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || hasUserPreference) {
      return;
    }

    let isActive = true;

    getCurrentUser(token)
      .then((response) => {
        if (isActive) {
          setEnabled(response.user.email_notifications_enabled);
        }
      })
      .catch((requestError: unknown) => {
        if (!isActive) {
          return;
        }

        setError(
          requestError instanceof ApiError
            ? requestError.message
            : "Unable to load notification settings.",
        );
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [hasUserPreference, token]);

  const loadUsage = useCallback(() => {
    if (!token) {
      setIsUsageLoading(false);
      return;
    }

    setIsUsageLoading(true);
    setUsageError(null);
    getUsage(token)
      .then((response) => {
        setUsage(response.usage);
      })
      .catch((requestError: unknown) => {
        setUsageError(
          requestError instanceof ApiError
            ? requestError.message
            : "Unable to load usage information.",
        );
      })
      .finally(() => {
        setIsUsageLoading(false);
      });
  }, [token]);

  useEffect(() => {
      if (!token) {
        return;
      }

      let isActive = true;
      getUsage(token)
        .then((response) => {
          if (isActive) {
            setUsage(response.usage);
          }
        })
        .catch((requestError: unknown) => {
          if (isActive) {
            setUsageError(
              requestError instanceof ApiError
                ? requestError.message
                : "Unable to load usage information.",
            );
          }
        })
        .finally(() => {
          if (isActive) {
            setIsUsageLoading(false);
          }
        });

      return () => {
        isActive = false;
      };
  }, [token]);

  const handleToggle = async () => {
    if (!token || enabled === null || isUpdating) {
      return;
    }

    const nextValue = !enabled;
    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await updateEmailNotifications(token, nextValue);
      setEnabled(response.email_notifications_enabled);
      setSuccess(
        response.email_notifications_enabled
          ? "Email notifications are enabled."
          : "Email notifications are disabled.",
      );
    } catch (requestError: unknown) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to update notification settings.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1 className="page-title">Settings</h1>
          <p className="page-description">
            Manage how WatchDog keeps you informed about monitored websites.
          </p>
        </div>
      </div>

      {error && (
        <ErrorFeedback
          title="Settings unavailable"
          className="settings-feedback"
        >
          {error}
        </ErrorFeedback>
      )}
      {success && (
        <SuccessFeedback
          title="Settings updated"
          className="settings-feedback"
        >
          {success}
        </SuccessFeedback>
      )}

      <section className="card settings-card" aria-labelledby="notification-settings-title">
        <div className="card-heading">
          <div>
            <h2 id="notification-settings-title">Notifications</h2>
            <p>Choose how WatchDog alerts you about website changes.</p>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-row-copy">
            <h3>Email notifications</h3>
            <p>
              Receive an email when one of your monitored websites changes.
              Disabling this prevents WatchDog from sending change notification emails.
            </p>
          </div>
          {isLoading || enabled === null ? (
            <div className="settings-loading" role="status">
              {isLoading ? "Loading" : "Unavailable"}
            </div>
          ) : (
            <button
              className={`settings-switch ${enabled ? "is-on" : ""}`}
              type="button"
              role="switch"
              aria-checked={enabled === true}
              aria-label="Email notifications"
              onClick={handleToggle}
              disabled={isUpdating}
            >
              <span className="settings-switch-track" aria-hidden="true">
                <span className="settings-switch-thumb" />
              </span>
              <span className="settings-switch-state">
                {isUpdating ? "Saving" : enabled ? "On" : "Off"}
              </span>
            </button>
          )}
        </div>
      </section>

      <section className="card settings-card settings-section" aria-labelledby="account-settings-title">
        <div className="card-heading">
          <div>
            <h2 id="account-settings-title">Account</h2>
            <p>Your WatchDog account information.</p>
          </div>
        </div>
        <div className="settings-details">
          <div>
            <span>Email</span>
            <strong>{user?.email ?? "Unavailable"}</strong>
          </div>
          <div>
            <span>Created</span>
            <strong>
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString()
                : "Unavailable"}
            </strong>
          </div>
        </div>
      </section>

      <section className="card settings-card settings-section" aria-labelledby="usage-settings-title">
        <div className="card-heading">
          <div>
            <h2 id="usage-settings-title">Usage</h2>
            <p>Current totals for resources owned by your account.</p>
          </div>
          {!isUsageLoading && (
            <button className="button button-secondary" type="button" onClick={loadUsage}>
              Refresh
            </button>
          )}
        </div>
        {isUsageLoading ? (
          <div className="settings-state" role="status">Loading usage</div>
        ) : usageError ? (
          <div className="settings-state">
            <ErrorFeedback title="Usage unavailable">{usageError}</ErrorFeedback>
            <button className="button button-secondary settings-retry" type="button" onClick={loadUsage}>
              Retry
            </button>
          </div>
        ) : usage ? (
          <div className="usage-grid">
            <div className="usage-item"><span>Monitors</span><strong>{usage.monitors.total}</strong><small>{usage.monitors.active} active · {usage.monitors.paused} paused</small></div>
            <div className="usage-item"><span>Checks</span><strong>{usage.checks.total}</strong><small>{usage.checks.changed} changes detected</small></div>
            <div className="usage-item"><span>Webhooks</span><strong>{usage.webhooks.total}</strong><small>{usage.webhooks.enabled} enabled</small></div>
          </div>
        ) : (
          <div className="settings-state">Usage unavailable.</div>
        )}
      </section>

      <section className="card settings-card settings-section" aria-labelledby="api-settings-title">
        <div className="card-heading">
          <div>
            <h2 id="api-settings-title">API</h2>
            <p>WatchDog handles monitoring, change detection, and webhook notifications for your account.</p>
          </div>
        </div>
        <div className="api-catalog">
          <p>Account and application settings are managed here. Advanced developer API access is not currently available.</p>
        </div>
      </section>
    </>
  );
}

export default SettingsPage;
