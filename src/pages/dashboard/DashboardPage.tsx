import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMonitors, type MonitorBackend } from "../../api/monitors.api";
import { ApiError } from "../../api/client";
import { useAuth } from "../../auth/useAuth";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import RelativeTime from "../../components/RelativeTime";
import StatusBadge, { type Status } from "../../components/StatusBadge";
import { presentationFallback } from "../../config/presentationFallback";

type AttentionItem = {
  monitor: MonitorBackend;
  reason: string;
  status: Status;
  label: string;
};

type ActivityItem = {
  monitor: MonitorBackend;
  kind: "created" | "checked";
  timestamp: string | null;
};

function getFriendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof TypeError) {
    return "Unable to reach WatchDog. Please try again.";
  }

  return "Something went wrong while loading your dashboard.";
}

function getStatusMeta(status: string): { label: string; tone: Status } {
  const normalized = status?.toLowerCase() ?? "neutral";

  if (normalized === "paused") {
    return { label: "Paused", tone: "paused" };
  }

  if (normalized === "active") {
    return { label: "Active", tone: "active" };
  }

  if (normalized === "error") {
    return { label: "Error", tone: "error" };
  }

  return { label: "Neutral", tone: "neutral" };
}

function getMonitorDate(monitor: MonitorBackend): string | null {
  return monitor.lastCheckedAt ?? monitor.createdAt;
}

function DashboardPage() {
  const { token, user } = useAuth();
  const [monitors, setMonitors] = useState<MonitorBackend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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

  const summary = useMemo(() => {
    const total = monitors.length;
    const active = monitors.filter((monitor) => monitor.status === "active").length;
    const paused = monitors.filter((monitor) => monitor.status === "paused").length;
    const recentMonitors = [...monitors].sort((left, right) => {
      const leftDate = getMonitorDate(left) ?? "";
      const rightDate = getMonitorDate(right) ?? "";

      if (!leftDate && !rightDate) return right.id - left.id;
      if (!leftDate) return 1;
      if (!rightDate) return -1;
      return new Date(rightDate).getTime() - new Date(leftDate).getTime();
    });

    const attention: AttentionItem[] = [];
    monitors.forEach((monitor) => {
      if (monitor.status === "paused") {
        attention.push({ monitor, reason: "This monitor is paused and is not checking the website.", status: "paused", label: "Paused" });
        return;
      }

      if (!monitor.lastCheckedAt) {
        attention.push({ monitor, reason: "This monitor has not completed its first check yet.", status: "never-checked", label: "Never checked" });
        return;
      }

      if (monitor.status === "error") {
        attention.push({ monitor, reason: "The monitor is reporting an error state.", status: "error", label: "Error" });
        return;
      }
    });
    attention.sort((left, right) => left.monitor.id - right.monitor.id);

    const activity: ActivityItem[] = recentMonitors.slice(0, 6).map((monitor) => ({
      monitor,
      kind: monitor.lastCheckedAt ? "checked" : "created",
      timestamp: getMonitorDate(monitor),
    }));

    return { total, active, paused, recentMonitors, attention, activity };
  }, [monitors]);

  const loadingState = (
    <section className="dashboard-loading" aria-live="polite" aria-label="Loading dashboard overview">
      <div className="dashboard-hero-skeleton">
        <div className="monitor-skeleton-row wide" />
        <div className="monitor-skeleton-row" />
      </div>
      <div className="metrics-grid">
        {[1, 2, 3].map((item) => (
          <article className="card metric-card" key={item}>
            <div className="monitor-skeleton">
              <div className="monitor-skeleton-row metric-skeleton-icon" />
              <div className="monitor-skeleton-row wide" />
              <div className="monitor-skeleton-row" />
            </div>
          </article>
        ))}
      </div>
      <div className="dashboard-content-grid">
        {[1, 2].map((item) => (
          <section className="card dashboard-panel" key={item}>
            <div className="monitor-skeleton dashboard-list-skeleton">
              <div className="monitor-skeleton-row wide" />
              <div className="monitor-skeleton-row" />
              <div className="monitor-skeleton-row" />
              <div className="monitor-skeleton-row" />
            </div>
          </section>
        ))}
      </div>
    </section>
  );

  const errorState = (
    <section className="card dashboard-empty-panel" aria-live="polite">
      <div className="empty-state">
        <div>
          <div className="empty-icon empty-icon-error" aria-hidden="true"><Icon name="alert" size={20} /></div>
          <strong>Unable to load your dashboard</strong>
          <p>{errorMessage}</p>
          <Button variant="secondary" onClick={() => void loadMonitors()}>Retry</Button>
        </div>
      </div>
    </section>
  );

  return (
    <>
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Monitoring workspace</p>
          <h1 className="page-title">Monitor what matters.</h1>
          <p className="page-description">Keep an eye on the websites that matter to your team and stay close to every check.</p>
          <p className="dashboard-greeting">Welcome back, {user?.email ?? presentationFallback.displayName}.</p>
        </div>
        <div className="dashboard-hero-actions">
          <Link to="/monitors">
            <Button icon={<Icon name="plus" size={16} />}>Add monitor</Button>
          </Link>
          <Link className="dashboard-secondary-action" to="/monitors">View all monitors <Icon name="arrow-right" size={15} /></Link>
        </div>
      </section>

      {isLoading ? loadingState : errorMessage ? errorState : (
        <>
          <section className="metrics-grid dashboard-metrics" aria-label="Monitoring overview">
            <article className="card metric-card metric-card-primary">
              <div className="metric-card-topline"><span className="metric-icon"><Icon name="monitors" size={18} /></span><span className="metric-label">Total monitors</span></div>
              <strong className="metric-value">{summary.total}</strong>
              <span className="metric-note">Everything you&apos;re tracking</span>
              <Link className="metric-link" to="/monitors">Manage monitors <Icon name="arrow-right" size={14} /></Link>
            </article>
            <article className="card metric-card metric-card-success">
              <div className="metric-card-topline"><span className="metric-icon"><Icon name="activity" size={18} /></span><span className="metric-label">Active monitors</span></div>
              <strong className="metric-value">{summary.active}</strong>
              <span className="metric-note">Currently checking</span>
              <Link className="metric-link" to="/monitors">View active monitors <Icon name="arrow-right" size={14} /></Link>
            </article>
            <article className="card metric-card metric-card-warning">
              <div className="metric-card-topline"><span className="metric-icon"><Icon name="alert" size={18} /></span><span className="metric-label">Paused monitors</span></div>
              <strong className="metric-value">{summary.paused}</strong>
              <span className="metric-note">Temporarily not checking</span>
              <Link className="metric-link" to="/monitors">Review monitors <Icon name="arrow-right" size={14} /></Link>
            </article>
          </section>

          {summary.total === 0 ? (
            <section className="card dashboard-empty-panel dashboard-first-monitor">
              <div className="empty-state">
                <div>
                  <div className="empty-icon" aria-hidden="true"><Icon name="spark" size={22} /></div>
                  <strong>Start monitoring what matters</strong>
                  <p>Add a website and WatchDog will keep its checks organized in one calm, focused workspace.</p>
                  <Link to="/monitors"><Button icon={<Icon name="plus" size={16} />}>Add your first monitor</Button></Link>
                </div>
              </div>
            </section>
          ) : (
            <div className="dashboard-content-grid">
              <section className="card dashboard-panel attention-panel">
                <div className="card-heading">
                  <div>
                    <h2>Needs attention</h2>
                    <p>Monitors that may need a closer look</p>
                  </div>
                  <Icon name="alert" size={18} />
                </div>
                {summary.attention.length === 0 ? (
                  <div className="dashboard-clear-state">
                    <span className="clear-state-icon"><Icon name="check" size={18} /></span>
                    <div><strong>Everything looks clear</strong><p>No paused, error, or unchecked monitors right now.</p></div>
                  </div>
                ) : (
                  <div className="dashboard-attention-list">
                    {summary.attention.map(({ monitor, reason, status, label }) => (
                      <Link className="dashboard-attention-item" to={`/monitors/${monitor.id}`} key={monitor.id}>
                        <span className={`attention-icon attention-icon-${status}`}><Icon name="alert" size={16} /></span>
                        <span className="dashboard-item-copy"><strong>{monitor.url}</strong><span>{reason}</span></span>
                        <StatusBadge status={status} label={label} />
                        <Icon name="arrow-right" size={16} />
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <section className="card dashboard-panel activity-panel">
                <div className="card-heading">
                  <div>
                    <h2>Recent monitoring activity</h2>
                    <p>Latest monitor checks and setup activity</p>
                  </div>
                  <Icon name="activity" size={18} />
                </div>
                <div className="dashboard-activity-list">
                  {summary.activity.map(({ monitor, kind, timestamp }) => (
                    <Link className="dashboard-activity-item" to={`/monitors/${monitor.id}`} key={`${monitor.id}-${kind}`}>
                      <span className={`activity-icon activity-icon-${kind}`}><Icon name={kind === "checked" ? "check" : "plus"} size={15} /></span>
                      <span className="dashboard-item-copy"><strong>{kind === "checked" ? "Monitor checked" : "Monitor created"}</strong><span>{monitor.url}</span></span>
                      <RelativeTime value={timestamp} className="dashboard-activity-time" />
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          )}

          {summary.total > 0 && (
            <section className="card dashboard-panel recent-monitors-panel">
              <div className="card-heading">
                <div>
                  <h2>Recent monitors</h2>
                  <p>Quick access to your latest monitoring entries</p>
                </div>
                <Link className="card-link" to="/monitors">View all monitors <Icon name="arrow-right" size={14} /></Link>
              </div>
              <div className="dashboard-list" aria-label="Recent monitors">
                {summary.recentMonitors.slice(0, 5).map((monitor) => {
                  const statusMeta = getStatusMeta(monitor.status);
                  return (
                    <Link className="dashboard-monitor-item" to={`/monitors/${monitor.id}`} key={monitor.id}>
                      <span className="dashboard-monitor-details">
                        <strong className="monitor-name">{monitor.url}</strong>
                        <span className="dashboard-monitor-meta"><StatusBadge status={statusMeta.tone} label={statusMeta.label} /><span>{monitor.lastCheckedAt ? "Last checked " : "Created "}<RelativeTime value={getMonitorDate(monitor)} /></span></span>
                      </span>
                      <Icon name="arrow-right" size={16} />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}

export default DashboardPage;
