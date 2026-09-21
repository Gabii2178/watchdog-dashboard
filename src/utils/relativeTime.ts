export type RelativeTimeResult = {
  label: string;
  exact: string;
};

export default function getRelativeTime(value: string | Date | null, now = new Date()): RelativeTimeResult {
  if (!value) {
    return { label: "Not available", exact: "Time not available" };
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { label: "Not available", exact: "Time not available" };
  }

  const difference = date.getTime() - now.getTime();
  const seconds = Math.round(Math.abs(difference) / 1000);
  const exact = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);

  if (seconds < 45) {
    return { label: difference > 0 ? "In a moment" : "Just now", exact };
  }

  const units = [
    { seconds: 60 * 60 * 24 * 365, label: "year" },
    { seconds: 60 * 60 * 24 * 30, label: "month" },
    { seconds: 60 * 60 * 24 * 7, label: "week" },
    { seconds: 60 * 60 * 24, label: "day" },
    { seconds: 60 * 60, label: "hour" },
    { seconds: 60, label: "minute" },
  ];

  const unit = units.find((candidate) => seconds >= candidate.seconds);
  if (!unit) {
    return { label: difference > 0 ? "In less than a minute" : "Just now", exact };
  }

  const count = Math.floor(seconds / unit.seconds);
  if (unit.label === "day" && count === 1 && difference < 0) {
    return { label: "Yesterday", exact };
  }

  return {
    label: difference > 0 ? `In ${count} ${unit.label}${count === 1 ? "" : "s"}` : `${count} ${unit.label}${count === 1 ? "" : "s"} ago`,
    exact,
  };
}
