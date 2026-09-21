export type Status = "active" | "healthy" | "paused" | "warning" | "error" | "changed" | "checking" | "never-checked" | "neutral";

type StatusBadgeProps = {
  status: Status;
  label?: string;
};

const labels: Record<Status, string> = {
  active: "Active",
  healthy: "Healthy",
  paused: "Paused",
  warning: "Warning",
  checking: "Checking",
  changed: "Changed",
  error: "Error",
  "never-checked": "Never checked",
  neutral: "Not configured",
};

function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-${status}`}>
      <span className="status-dot" aria-hidden="true" />
      {label ?? labels[status]}
    </span>
  );
}

export default StatusBadge;
