import type { ReactNode } from "react";
import Icon from "./Icon";

type FeedbackTone = "success" | "error" | "info" | "warning";

type FeedbackProps = {
  tone: FeedbackTone;
  title?: string;
  children: ReactNode;
  className?: string;
  onDismiss?: () => void;
};

const icons = {
  success: "success",
  error: "alert",
  info: "activity",
  warning: "alert",
} as const;

function Feedback({ tone, title, children, className = "", onDismiss }: FeedbackProps) {
  return (
    <div className={`feedback feedback-${tone} ${className}`.trim()} role={tone === "error" ? "alert" : "status"}>
      <Icon name={icons[tone]} size={18} />
      <div className="feedback-content">
        {title && <strong>{title}</strong>}
        <div>{children}</div>
      </div>
      {onDismiss && (
        <button className="feedback-dismiss" type="button" aria-label="Dismiss message" onClick={onDismiss}>
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  );
}

export function SuccessFeedback(props: Omit<FeedbackProps, "tone">) {
  return <Feedback tone="success" {...props} />;
}

export function ErrorFeedback(props: Omit<FeedbackProps, "tone">) {
  return <Feedback tone="error" {...props} />;
}

export function InfoFeedback(props: Omit<FeedbackProps, "tone">) {
  return <Feedback tone="info" {...props} />;
}

export function WarningFeedback(props: Omit<FeedbackProps, "tone">) {
  return <Feedback tone="warning" {...props} />;
}

export function Toast({ className = "", ...props }: FeedbackProps) {
  return <Feedback className={`toast ${className}`.trim()} {...props} />;
}

export default Feedback;
