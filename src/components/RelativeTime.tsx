import getRelativeTime from "../utils/relativeTime";

function RelativeTime({ value, className = "" }: { value: string | Date | null; className?: string }) {
  const time = getRelativeTime(value);
  return <time className={className} dateTime={value instanceof Date ? value.toISOString() : value ?? undefined} title={time.exact}>{time.label}</time>;
}

export default RelativeTime;
