import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  checkMonitorNow,
  getMonitor,
  getMonitorCheckEvidence,
  getMonitorCheckEvidenceImage,
  getMonitorChecks,
  pauseMonitor,
  resumeMonitor,
  type MonitorBackend,
  type MonitorCheckResponse,
} from "../../api/monitors.api";
import { ApiError } from "../../api/client";
import { useAuth } from "../../auth/useAuth";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import RelativeTime from "../../components/RelativeTime";
import StatusBadge, { type Status } from "../../components/StatusBadge";

function getFriendlyError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof TypeError) {
    return "Unable to reach WatchDog. Please try again.";
  }

  return fallback;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not checked yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
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
    return `${Math.round(value / 60)} min`;
  }

  return `${value} sec`;
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

function formatSimilarity(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

function MonitorDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [monitor, setMonitor] = useState<MonitorBackend | null>(null);
  const [checks, setChecks] = useState<MonitorCheckResponse[]>([]);
  const [selectedCheckId, setSelectedCheckId] = useState<number | null>(null);
  const [evidenceImages, setEvidenceImages] = useState<{
    before: string | null;
    after: string | null;
    diff: string | null;
  } | null>(null);
  const [isEvidenceLoading, setIsEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState("");
  const [evidenceRetryKey, setEvidenceRetryKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecksLoading, setIsChecksLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [checksError, setChecksError] = useState("");

  const monitorId = id ? Number(id) : NaN;

  const loadMonitor = useCallback(async () => {
    if (!Number.isInteger(monitorId) || !token) {
      setMonitor(null);
      setErrorMessage("Your session is no longer valid. Please sign in again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      setMonitor(await getMonitor(monitorId, token));
    } catch (error: unknown) {
      setMonitor(null);
      setErrorMessage(getFriendlyError(error, "Something went wrong while loading this monitor."));
    } finally {
      setIsLoading(false);
    }
  }, [monitorId, token]);

  const loadChecks = useCallback(async () => {
    if (!Number.isInteger(monitorId) || !token) {
      setChecks([]);
      setChecksError("Your session is no longer valid. Please sign in again.");
      setIsChecksLoading(false);
      return;
    }

    setIsChecksLoading(true);
    setChecksError("");

    try {
      const response = await getMonitorChecks(monitorId, token);
      setChecks(response.data);
      setSelectedCheckId(response.data[0]?.id ?? null);
    } catch (error: unknown) {
      setChecks([]);
      setChecksError(getFriendlyError(error, "Check history could not be loaded."));
    } finally {
      setIsChecksLoading(false);
    }
  }, [monitorId, token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMonitor();
      void loadChecks();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadChecks, loadMonitor]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!token || !Number.isInteger(monitorId) || selectedCheckId === null) {
        setEvidenceImages(null);
        setEvidenceError("");
        setIsEvidenceLoading(false);
        return;
      }

      let isMounted = true;
      const objectUrls: string[] = [];

      const loadEvidence = async () => {
        setIsEvidenceLoading(true);
        setEvidenceError("");
        setEvidenceImages(null);

        try {
          const metadata = await getMonitorCheckEvidence(monitorId, selectedCheckId, token);
          const artifacts = (["before", "after", "diff"] as const).filter(
            (artifact) => metadata.evidence[artifact] !== null,
          );
          const entries = await Promise.all(
            artifacts.map(async (artifact) => {
              const blob = await getMonitorCheckEvidenceImage(monitorId, selectedCheckId, artifact, token);
              const objectUrl = URL.createObjectURL(blob);
              objectUrls.push(objectUrl);
              return [artifact, objectUrl] as const;
            }),
          );

          if (!isMounted) {
            return;
          }

          const images: { before: string | null; after: string | null; diff: string | null } = {
            before: null,
            after: null,
            diff: null,
          };
          entries.forEach(([artifact, objectUrl]) => {
            images[artifact] = objectUrl;
          });
          setEvidenceImages(images);
        } catch (error: unknown) {
          if (isMounted) {
            setEvidenceImages(null);
            setEvidenceError(getFriendlyError(error, "Visual evidence could not be loaded."));
          }
        } finally {
          if (isMounted) {
            setIsEvidenceLoading(false);
          }
        }
      };

      void loadEvidence();

      return () => {
        isMounted = false;
        objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
      };
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [evidenceRetryKey, monitorId, selectedCheckId, token]);

  const handleCheckNow = async () => {
    if (!token || !Number.isInteger(monitorId)) {
      setErrorMessage("Your session is no longer valid. Please sign in again.");
      return;
    }

    setIsActionLoading(true);
    setErrorMessage("");
    try {
      await checkMonitorNow(monitorId, token);
      await Promise.all([loadMonitor(), loadChecks()]);
    } catch (error: unknown) {
      setErrorMessage(getFriendlyError(error, "The monitor could not be checked right now."));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!token || !monitor) {
      setErrorMessage("Your session is no longer valid. Please sign in again.");
      return;
    }

    setIsActionLoading(true);
    setErrorMessage("");
    try {
      if (monitor.status.toLowerCase() === "paused") {
        await resumeMonitor(monitor.id, token);
      } else {
        await pauseMonitor(monitor.id, token);
      }
      await loadMonitor();
    } catch (error: unknown) {
      setErrorMessage(getFriendlyError(error, "The monitor status could not be updated."));
    } finally {
      setIsActionLoading(false);
    }
  };

  const statusMeta = monitor ? getStatusMeta(monitor.status) : null;
  const latestCheck = checks[0] ?? null;
  const selectedCheck = checks.find((check) => check.id === selectedCheckId) ?? null;

  return (
    <>
      <div className="page-header monitor-details-page-header">
        <div>
          <p className="eyebrow">Monitor / {id}</p>
          <h1 className="page-title">Visual monitoring</h1>
          <p className="page-description">Reliable evidence of how this website changes over time.</p>
        </div>
        <Link to="/monitors">
          <Button variant="secondary" icon={<Icon name="arrow-left" size={15} />}>Back to monitors</Button>
        </Link>
      </div>

      {isLoading ? (
        <section className="card detail-card" aria-live="polite" aria-label="Loading monitor details">
          <div className="monitor-skeleton">
            <div className="monitor-skeleton-row wide" />
            <div className="monitor-skeleton-row" />
            <div className="monitor-skeleton-row" />
          </div>
        </section>
      ) : errorMessage && !monitor ? (
        <section className="card detail-card" aria-live="polite">
          <div className="empty-state">
            <div>
              <div className="empty-icon" aria-hidden="true"><Icon name="alert" size={20} /></div>
              <strong>Unable to load monitor</strong>
              <p>{errorMessage}</p>
              <Link to="/monitors"><Button variant="secondary">Return to monitors</Button></Link>
            </div>
          </div>
        </section>
      ) : monitor ? (
        <div className="monitor-details">
          <section className="card monitor-identity-card">
            <div className="monitor-identity-main">
              <div className="monitor-identity-copy">
                <span className="monitor-detail-label">Website monitor</span>
                <h2>{monitor.url}</h2>
                <a className="monitor-detail-url" href={monitor.url} target="_blank" rel="noreferrer noopener">{monitor.url}</a>
              </div>
              <StatusBadge status={statusMeta?.tone ?? "neutral"} label={statusMeta?.label ?? "Unknown"} />
            </div>
            <div className="monitor-identity-facts">
              <div><span>Frequency</span><strong>Every {formatSeconds(monitor.checkInterval)}</strong></div>
              <div><span>Threshold</span><strong>{monitor.changeThreshold}% similarity</strong></div>
              <div><span>Last checked</span><strong>{formatDate(monitor.lastCheckedAt)}</strong></div>
            </div>
            <div className="monitor-action-row">
              <Button onClick={() => void handleCheckNow()} disabled={isActionLoading} icon={<Icon name="activity" size={15} />}>
                {isActionLoading ? "Working..." : "Check now"}
              </Button>
              <Button variant="secondary" onClick={() => void handleToggleStatus()} disabled={isActionLoading}>
                {monitor.status.toLowerCase() === "paused" ? "Resume monitoring" : "Pause monitoring"}
              </Button>
              <Link to={`/monitors/${monitor.id}/webhooks`} className="button button-ghost">
                <Icon name="webhook" size={15} /> Webhooks
              </Link>
            </div>
            {errorMessage && <p className="form-error monitor-action-error" role="alert">{errorMessage}</p>}
          </section>

          <section className={`card latest-signal-card ${latestCheck?.changed ? "latest-signal-changed" : ""}`}>
            <div className="card-heading">
              <div><h2>Latest signal</h2><p>The most recent result from the visual comparison engine.</p></div>
              <Icon name="activity" size={19} />
            </div>
            {isChecksLoading ? (
              <div className="detail-loading-block" aria-label="Loading latest signal"><div /><div /><div /></div>
            ) : checksError ? (
              <div className="detail-inline-state"><Icon name="alert" size={18} /><div><strong>Latest signal unavailable</strong><p>{checksError}</p><Button variant="secondary" onClick={() => void loadChecks()}>Try again</Button></div></div>
            ) : latestCheck ? (
              <div className="latest-signal-content">
                <div className="latest-signal-result">
                  <StatusBadge status={latestCheck.changed ? "changed" : "healthy"} label={latestCheck.changed ? "Changed" : "No change"} />
                  <strong>{latestCheck.changed ? "Visual change detected" : "No visual change detected"}</strong>
                  <p>{latestCheck.changed ? "The monitoring engine detected a visual difference between checks." : "The monitoring engine found no visual difference in this check."}</p>
                </div>
                <div className="latest-signal-facts">
                  <div><span>Similarity</span><strong>{formatSimilarity(latestCheck.similarity)}</strong></div>
                  <div><span>Checked</span><strong><RelativeTime value={latestCheck.createdAt} /></strong><small>{formatDate(latestCheck.createdAt)}</small></div>
                </div>
              </div>
            ) : (
              <div className="detail-inline-state"><Icon name="spark" size={18} /><div><strong>No checks yet</strong><p>WatchDog has not captured the first monitoring result for this website.</p><Button onClick={() => void handleCheckNow()} disabled={isActionLoading}>Check now</Button></div></div>
            )}
          </section>

          <section className="card change-evidence-card">
            <div className="card-heading">
              <div>
                <h2>Change evidence</h2>
                <p>Review the captured visual evidence for the selected check.</p>
              </div>
              <Icon name="monitors" size={18} />
            </div>
            {!selectedCheck ? (
              <div className="detail-inline-state">
                <Icon name="spark" size={18} />
                <div><strong>No check selected</strong><p>Select a check from the history below to inspect its evidence.</p></div>
              </div>
            ) : isEvidenceLoading ? (
              <div className="evidence-loading" aria-label="Loading visual evidence">
                <div /><div /><div />
              </div>
            ) : evidenceError ? (
              <div className="detail-inline-state">
                <Icon name="alert" size={18} />
                <div>
                  <strong>Evidence unavailable</strong>
                  <p>{evidenceError}</p>
                  <Button variant="secondary" onClick={() => setEvidenceRetryKey((current) => current + 1)}>Try again</Button>
                </div>
              </div>
            ) : !evidenceImages || (!evidenceImages.before && !evidenceImages.after && !evidenceImages.diff) ? (
              <div className="detail-inline-state">
                <Icon name="spark" size={18} />
                <div><strong>No visual evidence is available for this check.</strong><p>This is expected for older historical checks.</p></div>
              </div>
            ) : (
              <div className="evidence-content">
                {!evidenceImages.before && evidenceImages.after && (
                  <p className="evidence-note"><Icon name="info" size={16} /> First captured state — there is no earlier screenshot to compare.</p>
                )}
                <div className={`evidence-grid evidence-grid-${[evidenceImages.before, evidenceImages.after, evidenceImages.diff].filter(Boolean).length}`}>
                  {(["before", "after", "diff"] as const).map((artifact) => {
                    const imageUrl = evidenceImages[artifact];
                    if (!imageUrl) {
                      return null;
                    }

                    return (
                      <figure className="evidence-figure" key={artifact}>
                        <figcaption>{artifact === "before" ? "Before" : artifact === "after" ? "After" : "Diff"}</figcaption>
                        <div className="evidence-image-frame">
                          <img src={imageUrl} alt={`${artifact} visual evidence for check ${selectedCheck.id}`} />
                        </div>
                      </figure>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          <div className="monitor-details-grid">
            <section className="card detail-card check-history-card">
              <div className="card-heading"><div><h2>Check history</h2><p>What the visual monitoring engine reported over time.</p></div><span className="history-count">{checks.length}</span></div>
              {isChecksLoading ? (
                <div className="history-skeleton" aria-label="Loading check history"><div /><div /><div /><div /></div>
              ) : checksError ? (
                <div className="detail-inline-state"><Icon name="alert" size={18} /><div><strong>Check history unavailable</strong><p>{checksError}</p><Button variant="secondary" onClick={() => void loadChecks()}>Try again</Button></div></div>
              ) : checks.length === 0 ? (
                <div className="detail-inline-state"><Icon name="spark" size={18} /><div><strong>No checks yet</strong><p>Run a check to start building a factual monitoring history.</p><Button onClick={() => void handleCheckNow()} disabled={isActionLoading}>Check now</Button></div></div>
              ) : (
                <div className="check-history-list">
                  {checks.map((check) => (
                    <button
                      className={`check-history-row ${selectedCheckId === check.id ? "is-selected" : ""}`}
                      key={check.id}
                      type="button"
                      onClick={() => setSelectedCheckId(check.id)}
                      aria-pressed={selectedCheckId === check.id}
                    >
                      <span className={`history-icon ${check.changed ? "is-changed" : ""}`} aria-hidden="true"><Icon name={check.changed ? "alert" : "check"} size={15} /></span>
                      <div className="check-history-main"><strong>{check.changed ? "Visual change detected" : "No visual change detected"}</strong><span><RelativeTime value={check.createdAt} /> <span aria-hidden="true">·</span> {formatDate(check.createdAt)}</span></div>
                      <div className="check-history-similarity"><span>Similarity</span><strong>{formatSimilarity(check.similarity)}</strong></div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="card detail-card">
              <div className="card-heading"><div><h2>Monitoring configuration</h2><p>Settings currently applied to this monitor.</p></div><Icon name="settings" size={18} /></div>
              <dl className="detail-list">
                <div><dt>Status</dt><dd><StatusBadge status={statusMeta?.tone ?? "neutral"} label={statusMeta?.label ?? "Unknown"} /></dd></div>
                <div><dt>URL</dt><dd className="detail-value-url">{monitor.url}</dd></div>
                <div><dt>Check interval</dt><dd>{formatSeconds(monitor.checkInterval)}</dd></div>
                <div><dt>Change threshold</dt><dd>{monitor.changeThreshold}%</dd></div>
                <div><dt>Notification cooldown</dt><dd>{formatSeconds(monitor.notificationCooldown)}</dd></div>
                <div><dt>Created</dt><dd>{formatDate(monitor.createdAt)}</dd></div>
              </dl>
            </section>
          </div>
        </div>
      ) : (
        <section className="card detail-card"><div className="empty-state"><div><div className="empty-icon" aria-hidden="true"><Icon name="spark" size={20} /></div><strong>Monitor not found</strong><p>The requested monitor could not be loaded.</p><Link to="/monitors"><Button variant="secondary">Return to monitors</Button></Link></div></div></section>
      )}
    </>
  );
}

export default MonitorDetailsPage;
