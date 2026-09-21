import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import PasswordField from "../../components/PasswordField";
import { ApiError } from "../../api/client";
import { useAuth } from "../../auth/useAuth";

type LoginErrors = {
  email?: string;
  password?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLogin(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {};
  if (!email.trim()) errors.email = "Enter your email address.";
  else if (!emailPattern.test(email.trim())) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";
  return errors;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError) return "Unable to connect to WatchDog. Try again.";
  return "Something went wrong. Try again.";
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateLogin(email, password);
    setErrors(nextErrors);
    setApiError("");
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";
      navigate(destination, { replace: true });
    } catch (error: unknown) {
      setApiError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <div className="brand"><div className="brand-mark" aria-hidden="true"><span /></div><span>Watch<span className="brand-accent">Dog</span></span></div>
        <div className="auth-message"><h2>Know when something changes.</h2><p>Quiet, reliable website monitoring for teams that care about what happens in production.</p><div className="signal-line"><span />Monitoring made precise</div></div>
      </aside>
      <section className="auth-form-side" aria-labelledby="login-title">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="brand"><div className="brand-mark" aria-hidden="true"><span /></div><span>Watch<span className="brand-accent">Dog</span></span></div>
          <h1 id="login-title">Welcome back</h1>
          <p>Sign in to your monitoring workspace.</p>
          <div className={`form-field ${errors.email ? "has-error" : ""}`}>
            <label htmlFor="email">Work email</label>
            <input id="email" type="email" value={email} placeholder="you@company.com" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} onChange={(event) => setEmail(event.target.value)} />
            {errors.email && <p className="field-error" id="email-error">{errors.email}</p>}
          </div>
          <PasswordField id="password" label="Password" value={password} error={errors.password} autoComplete="current-password" onChange={setPassword} onBlur={() => setErrors(validateLogin(email, password))} />
          <div className="auth-form-error" role="alert" aria-live="polite">{apiError}</div>
          <Button className="form-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in..." : "Sign in"}</Button>
          <p className="auth-switch">Don’t have an account? <Link to="/register">Create one</Link></p>
          <p className="auth-note">By continuing, you agree to WatchDog’s terms and privacy policy.</p>
        </form>
      </section>
    </div>
  );
}

export default LoginPage;
