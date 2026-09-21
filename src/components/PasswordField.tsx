import { useState } from "react";

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  error?: string;
  autoComplete: "current-password" | "new-password";
  onChange: (value: string) => void;
  onBlur: () => void;
};

function PasswordField({
  id,
  label,
  value,
  error,
  autoComplete,
  onChange,
  onBlur,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className={`form-field ${error ? "has-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="password-input-wrap">
        <input
          id={id}
          type={isVisible ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
        <button
          className="password-toggle"
          type="button"
          aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          onClick={() => setIsVisible((visible) => !visible)}
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>
      {error && <p className="field-error" id={errorId}>{error}</p>}
    </div>
  );
}

export default PasswordField;
