import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  icon?: ReactNode;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", icon, children, className = "", ...props },
  ref,
) {
  return (
    <button ref={ref} className={`button button-${variant} ${className}`.trim()} {...props}>
      {icon && <span className="button-icon" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </button>
  );
});

export default Button;
