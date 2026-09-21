import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  checkMonitorNow,
  createMonitor,
  deleteMonitor,
  getMonitors,
  pauseMonitor,
  resumeMonitor,
  type MonitorBackend,
} from "../../api/monitors.api";
import { ApiError } from "../../api/client";
import { useAuth } from "../../auth/useAuth";
import Button from "../../components/Button";
import StatusBadge from "../../components/StatusBadge";
import Icon from "../../components/Icon";

type MonitorFormState = {
  url: string;
  checkInterval: string;
  changeThreshold: string;
  notificationCooldown: string;
};

type BusyAction = {
  id: number;
  action: "pause" | "resume" | "check" | "delete";
};

const initialFormState: MonitorFormState = {
  url: "",
  checkInterval: "300",
  changeThreshold: "95",
  notificationCooldown: "1800",
};

function getFriendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof TypeError) {
    return "Unable to reach WatchDog. Please try again.";
  }

  return "Something went wrong while updating your monitors.";
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not checked yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not checked yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatSeconds(value: number): string {
  if (value >= 60) {
    const minutes = Math.round(value / 60);
    return `${minutes} min`;
  }

  return `${value} sec`;
}

function getStatusMeta(status: string): { label: string; tone: "healthy" | "paused" | "neutral" | "error" } {
  const normalized = status?.toLowerCase() ?? "neutral";

  if (normalized === "paused") {
    return { label: "Paused", tone: "paused" };
  }

  if (normalized === "active") {
    return { label: "Healthy", tone: "healthy" };
  }

  if (normalized === "error") {
    return { label: "Error", tone: "error" };
  }

  return { label: "Neutral", tone: "neutral" };
}

function MonitorsPage() {
  const { token } = useAuth();
  const [monitors, setMonitors] = useState<MonitorBackend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState<MonitorFormState>(initialFormState);
  const [formError, setFormError] = useState("");
  const [busyAction, setBusyAction] = useState<BusyAction | null>(null);

  const loadMonitors = useCallback(async () => {
    if (!token) {
      setMonitors([]);
      setErrorMessage("");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await getMonitors(token);
      setMonitors(response);
    } catch (error: unknown) {
      setMonitors([]);
      setErrorMessage(getFriendlyError(error));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMonitors();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadMonitors]);

  const handleCreateMonitor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setFormError("Your session is no longer valid. Please sign in again.");
      return;
    }

    const url = formState.url.trim();
    if (!url) {
      setFormError("Enter a website URL.");
      return;
    }

    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        throw new Error("Unsupported protocol");
      }
    } catch {
      setFormError("Enter a valid http or https URL.");
      return;
    }

    const checkInterval = Number(formState.checkInterval);
    const changeThreshold = Number(formState.changeThreshold);
    const notificationCooldown = Number(formState.notificationCooldown);

    if (!Number.isFinite(checkInterval) || checkInterval <= 0) {
      setFormError("Check interval must be a positive number.");
      return;
    }

    if (!Number.isFinite(changeThreshold) || changeThreshold < 0 || changeThreshold > 100) {
      setFormError("Change threshold must be between 0 and 100.");
      return;
    }

    if (!Number.isFinite(notificationCooldown) || notificationCooldown < 0) {
      setFormError("Notification cooldown must be zero or greater.");
      return;
    }

    try {
      await createMonitor(
        {
          url,
          checkInterval,
          changeThreshold,
          notificationCooldown,
        },
        token,
      );

      setFormState(initialFormState);
      setFormError("");
      setIsFormOpen(false);
      await loadMonitors();
    } catch (error: unknown) {
      setFormError(getFriendlyError(error));
    }
  };

  const handleDeleteMonitor = async (monitor: MonitorBackend) => {
    if (!token) {
      setErrorMessage("Your session is no longer valid. Please sign in again.");
      return;
    }

    const confirmed = window.confirm(`Delete monitor for ${monitor.url}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setBusyAction({ id: monitor.id, action: "delete" });

    try {
      await deleteMonitor(monitor.id, token);
      setMonitors((currentMonitors) => currentMonitors.filter((item) => item.id !== monitor.id));
      setErrorMessage("");
    } catch (error: unknown) {
      setErrorMessage(getFriendlyError(error));
    } finally {
      setBusyAction(null);
    }
  };

  const handleToggleStatus = async (monitor: MonitorBackend) => {
    if (!token) {
      setErrorMessage("Your session is no longer valid. Please sign in again.");
      return;
    }

    const isPaused = monitor.status === "paused";
    const nextAction = isPaused ? "resume" : "pause";
    setBusyAction({ id: monitor.id, action: nextAction });

    try {
      const response = isPaused
        ? await resumeMonitor(monitor.id, token)
        : await pauseMonitor(monitor.id, token);

      setMonitors((currentMonitors) =>
        currentMonitors.map((item) =>
          item.id === monitor.id
            ? { ...item, status: response.status }
            : item,
        ),
      );
    } catch (error: unknown) {
      setErrorMessage(getFriendlyError(error));
    } finally {
      setBusyAction(null);
    }
  };

  const handleCheckNow = async (monitor: MonitorBackend) => {
    if (!token) {
      setErrorMessage("Your session is no longer valid. Please sign in again.");
      return;
    }

    setBusyAction({ id: monitor.id, action: "check" });

    try {
      await checkMonitorNow(monitor.id, token);
      await loadMonitors();
    } catch (error: unknown) {
      setErrorMessage(getFriendlyError(error));
    } finally {
      setBusyAction(null);
    }
  };

  const pageHeader = (
    <div className="page-header">
      <div>
        <p className="eyebrow">Workspace</p>
        <h1 className="page-title">Monitors</h1>
        <p className="page-description">Manage the websites you’re watching for changes.</p>
      </div>
      <Button icon={<Icon name="plus" size={16} />} onClick={() => setIsFormOpen((open) => !open)}>
        {isFormOpen ? "Close" : "Add monitor"}
      </Button>
    </div>
  );

  const loadingState = (
    <section className="card monitor-list" aria-live="polite" aria-label="Loading monitors">
      <div className="monitor-skeleton">
        <div className="monitor-skeleton-row wide" />
        <div className="monitor-skeleton-row" />
        <div className="monitor-skeleton-row" />
      </div>
    </section>
  );

  const errorState = (
    <section className="card" aria-live="polite">
      <div className="empty-state">
        <div>
          <div className="empty-icon" aria-hidden="true">!</div>
          <strong>Unable to load monitors</strong>
          <p>{errorMessage}</p>
          <Button variant="secondary" onClick={() => void loadMonitors()}>Retry</Button>
        </div>
      </div>
    </section>
  );

  const emptyState = (
    <section className="card monitor-list" aria-label="Monitors">
      <div className="empty-state">
        <div>
          <div className="empty-icon" aria-hidden="true"><Icon name="spark" size={20} /></div>
          <strong>No monitors yet</strong>
          <p>Add your first website to begin monitoring its availability and content changes.</p>
          <Button icon={<Icon name="plus" size={16} />} onClick={() => setIsFormOpen(true)}>Add your first monitor</Button>
        </div>
      </div>
    </section>
  );

  return (
    <>
      {pageHeader}

      {isFormOpen && (
        <section className="card monitor-form-card" aria-label="Create monitor form">
          <form className="monitor-form" onSubmit={handleCreateMonitor} noValidate>
            <div className="monitor-form-field monitor-form-field-wide">
              <label htmlFor="monitor-url">Website URL</label>
              <input
                id="monitor-url"
                type="url"
                value={formState.url}
                placeholder="https://example.com"
                onChange={(event) => setFormState((current) => ({ ...current, url: event.target.value }))}
                aria-invalid={Boolean(formError)}
              />
            </div>
            <div className="monitor-form-field">
              <label htmlFor="monitor-interval">Check interval</label>
              <input
                id="monitor-interval"
                type="number"
                min="1"
                step="1"
                value={formState.checkInterval}
                onChange={(event) => setFormState((current) => ({ ...current, checkInterval: event.target.value }))}
              />
            </div>
            <div className="monitor-form-field">
              <label htmlFor="monitor-threshold">Change threshold</label>
              <input
                id="monitor-threshold"
                type="number"
                min="0"
                max="100"
                step="1"
                value={formState.changeThreshold}
                onChange={(event) => setFormState((current) => ({ ...current, changeThreshold: event.target.value }))}
              />
            </div>
            <div className="monitor-form-field">
              <label htmlFor="monitor-cooldown">Notification cooldown</label>
              <input
                id="monitor-cooldown"
                type="number"
                min="0"
                step="1"
                value={formState.notificationCooldown}
                onChange={(event) => setFormState((current) => ({ ...current, notificationCooldown: event.target.value }))}
              />
            </div>
            <div className="monitor-form-actions">
              <Button type="button" variant="secondary" onClick={() => {
                setFormState(initialFormState);
                setFormError("");
                setIsFormOpen(false);
              }}>
                Cancel
              </Button>
              <Button type="submit">Create monitor</Button>
            </div>
            {formError && <p className="monitor-form-error" role="alert">{formError}</p>}
          </form>
        </section>
      )}

      <div className="table-toolbar">
        <input className="search-input" placeholder="Search monitors..." aria-label="Search monitors" />
        <Button variant="secondary" icon={<Icon name="chevron-down" size={15} />}>All statuses</Button>
      </div>

      {isLoading ? loadingState : errorMessage && monitors.length === 0 ? errorState : monitors.length === 0 ? emptyState : (
        <>
          {errorMessage && <p className="monitor-form-error" role="alert">{errorMessage}</p>}
          <section className="card monitor-list" aria-label="Monitors">
            {monitors.map((monitor) => {
              const statusMeta = getStatusMeta(monitor.status);
              const isBusy = busyAction?.id === monitor.id;

              return (
                <div className="monitor-row" key={monitor.id}>
                  <div className="monitor-info">
                    <Link className="monitor-name" to={`/monitors/${monitor.id}`}>
                      {monitor.url}
                    </Link>
                    <span className="monitor-meta">
                      #{monitor.id} • Check interval {formatSeconds(monitor.checkInterval)} • Threshold {monitor.changeThreshold}% • Cooldown {formatSeconds(monitor.notificationCooldown)} • Last checked {formatDate(monitor.lastCheckedAt)} • Created {formatDate(monitor.createdAt)}
                    </span>
                  </div>
                  <StatusBadge status={statusMeta.tone} label={statusMeta.label} />
                  <div className="monitor-actions">
                    <button
                      className="row-action"
                      type="button"
                      aria-label={monitor.status === "paused" ? `Resume monitor ${monitor.id}` : `Pause monitor ${monitor.id}`}
                      title={monitor.status === "paused" ? "Resume" : "Pause"}
                      disabled={isBusy}
                      onClick={() => void handleToggleStatus(monitor)}
                    >
                      {monitor.status === "paused" ? "▶" : "⏸"}
                    </button>
                    <button
                      className="row-action"
                      type="button"
                      aria-label={`Check monitor ${monitor.id} now`}
                      title="Check now"
                      disabled={isBusy}
                      onClick={() => void handleCheckNow(monitor)}
                    >
                      ↻
                    </button>
                    <button
                      className="row-action"
                      type="button"
                      aria-label={`Delete monitor ${monitor.id}`}
                      title="Delete"
                      disabled={isBusy}
                      onClick={() => void handleDeleteMonitor(monitor)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        </>
      )}

      <p style={{ color: "var(--muted)", fontSize: 11, marginTop: 16 }}>
        Need help getting started? <Link to="/dashboard" className="card-link">View the overview</Link>
      </p>
    </>
  );
}

export default MonitorsPage;