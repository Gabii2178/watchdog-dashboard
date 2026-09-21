import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import PasswordField from "../../components/PasswordField";
import { ApiError } from "../../api/client";
import { registerUser } from "../../api/auth.api";
import { presentationFallback } from "../../config/presentationFallback";

type RegisterErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister(name: string, email: string, password: string, confirmPassword: string): RegisterErrors {
  const errors: RegisterErrors = {};
  if (!name.trim()) errors.name = "Enter your name.";
  if (!email.trim()) errors.email = "Enter your email address.";
  else if (!emailPattern.test(email.trim())) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Create a password.";
  else if (password.length < 8) errors.password = "Password must be at least 8 characters.";
  else if (password.length > 128) errors.password = "Password must be 128 characters or fewer.";
  if (!confirmPassword) errors.confirmPassword = "Confirm your password.";
  else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
  return errors;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError) return "Unable to connect to WatchDog. Try again.";
  return "Something went wrong. Try again.";
}

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateRegister(name, email, password, confirmPassword);
    setErrors(nextErrors);
    setApiError("");
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await registerUser({ email: email.trim(), password });
      navigate("/login", { replace: true });
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
        <div className="auth-message"><h2>Clarity for your web.</h2><p>Keep an eye on the pages that matter, with signal instead of noise.</p><div className="signal-line"><span />Start monitoring in minutes</div></div>
      </aside>
      <section className="auth-form-side" aria-labelledby="register-title">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="brand"><div className="brand-mark" aria-hidden="true"><span /></div><span>Watch<span className="brand-accent">Dog</span></span></div>
          <h1 id="register-title">Create your account</h1>
          <p>Set up your workspace and start monitoring.</p>
          <div className={`form-field ${errors.name ? "has-error" : ""}`}>
            <label htmlFor="name">Full name</label>
            <input id="name" type="text" value={name} placeholder={presentationFallback.displayName} autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} onChange={(event) => setName(event.target.value)} />
            {errors.name && <p className="field-error" id="name-error">{errors.name}</p>}
          </div>
          <div className={`form-field ${errors.email ? "has-error" : ""}`}>
            <label htmlFor="register-email">Work email</label>
            <input id="register-email" type="email" value={email} placeholder="you@company.com" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "register-email-error" : undefined} onChange={(event) => setEmail(event.target.value)} />
            {errors.email && <p className="field-error" id="register-email-error">{errors.email}</p>}
          </div>
          <PasswordField id="register-password" label="Password" value={password} error={errors.password} autoComplete="new-password" onChange={setPassword} onBlur={() => setErrors(validateRegister(name, email, password, confirmPassword))} />
          <PasswordField id="confirm-password" label="Confirm password" value={confirmPassword} error={errors.confirmPassword} autoComplete="new-password" onChange={setConfirmPassword} onBlur={() => setErrors(validateRegister(name, email, password, confirmPassword))} />
          <div className="auth-form-error" role="alert" aria-live="polite">{apiError}</div>
          <Button className="form-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating account..." : "Create account"}</Button>
          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
          <p className="auth-note">By creating an account, you agree to WatchDog’s terms and privacy policy.</p>
        </form>
      </section>
    </div>
  );
}

export default RegisterPage;
