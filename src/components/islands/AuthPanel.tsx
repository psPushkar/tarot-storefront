import { useEffect, useState } from 'preact/hooks';

import {
  forgotPassword,
  login,
  register,
  resetPassword,
  verifyEmail,
} from '../../lib/api';
import type { ApiFailure } from '../../lib/result';
import { saveSession } from '../../lib/session';

/* ═══════════════════════════════════════════════════════════════════════
   Props
   ═══════════════════════════════════════════════════════════════════════ */

interface Props {
  mode: 'login' | 'register' | 'forgot' | 'reset' | 'verify';
}

/* ═══════════════════════════════════════════════════════════════════════
   Copy table — every API error maps to composed prose.
   ═══════════════════════════════════════════════════════════════════════ */

function describe(error: ApiFailure): { heading: string; body: string } {
  switch (error.code) {
    case 'invalid_credentials':
      return {
        heading: "That sign-in didn\u2019t work.",
        body: 'The email or password is not right, or the account has not been confirmed yet. Check your inbox for a confirmation link.',
      };
    case 'locked_out':
      return {
        heading: 'Too many attempts.',
        body: 'This account is locked for a short while after several failed sign-ins. Please wait a few minutes and try again.',
      };
    case 'rate_limited':
      return {
        heading: 'Please slow down.',
        body: error.retryAfter
          ? `Wait about ${error.retryAfter} seconds before trying again.`
          : 'Wait a moment before trying again.',
      };
    case 'email_unavailable':
      return {
        heading: "Accounts aren\u2019t available just yet.",
        body: 'Email delivery has not been set up for this practice, so an account cannot be confirmed. You can still book as a guest, and keep the link you receive at checkout.',
      };
    case 'invalid_token':
      return {
        heading: 'That link has expired.',
        body: 'Verification and reset links can only be used once, and not for long. Request a new one and it will arrive shortly.',
      };
    case 'bad_request':
      return {
        heading: 'Something in the form needs attention.',
        body: 'Please check the details you entered and try once more.',
      };
    case 'network_error':
    case 'timeout':
    case 'server_error':
    case 'not_configured':
      return {
        heading: "Something didn\u2019t come through.",
        body: "This couldn\u2019t be completed at the moment. Please try again in a moment.",
      };
    default:
      return {
        heading: "Something didn\u2019t come through.",
        body: "This couldn\u2019t be completed at the moment. Please try again in a moment.",
      };
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   Field
   ═══════════════════════════════════════════════════════════════════════ */

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onInput: (value: string) => void;
  type?: string;
  error?: string;
  help?: string;
  optional?: boolean;
  autocomplete?: string;
}

function Field({
  id,
  label,
  value,
  onInput,
  type = 'text',
  error,
  help,
  optional = false,
  autocomplete,
}: FieldProps) {
  const describedBy = [error ? `${id}-error` : null, help ? `${id}-help` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div class="field">
      <label class="label" for={id}>
        {label}
        {optional && <span class="field__optional"> — optional</span>}
      </label>
      <input
        id={id}
        name={id}
        class="input"
        type={type}
        value={value}
        aria-invalid={error ? ('true' as const) : undefined}
        aria-describedby={describedBy || undefined}
        autocomplete={autocomplete}
        onInput={(event) => onInput((event.target as HTMLInputElement).value)}
      />
      {help && (
        <p class="help" id={`${id}-help`}>
          {help}
        </p>
      )}
      {error && (
        <p class="error-text" id={`${id}-error`}>
          <span aria-hidden="true">{'\u26A0'}</span>
          {error}
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════ */

export default function AuthPanel({ mode }: Props) {
  /* ── Shared state ─────────────────────────────────────────────────── */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiFailure | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  /* ── Verify mode auto-fires on mount ─────────────────────────────── */
  const [verifyState, setVerifyState] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (mode !== 'verify') return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      setError({
        code: 'invalid_token',
        status: 0,
        message: '',
      });
      setVerifyState('error');
      return;
    }

    let cancelled = false;
    (async () => {
      const result = await verifyEmail(token);
      if (cancelled) return;

      if (result.ok) {
        saveSession(result.data);
        setVerifyState('success');
        window.setTimeout(() => {
          window.location.href = '/account';
        }, 1500);
      } else {
        setError(result.error);
        setVerifyState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode]);

  /* ── Validation helpers ──────────────────────────────────────────── */
  function validatePassword(pw: string): string | undefined {
    if (pw.length < 8) return 'At least 8 characters are needed.';
    if (pw.length > 200) return 'That is too long — 200 characters at most.';
    return undefined;
  }

  /* ── Submit ──────────────────────────────────────────────────────── */
  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    if (submitting) return;

    const errors: Record<string, string> = {};
    setError(null);

    if (mode === 'login') {
      if (!email.trim()) errors.email = 'This field is required to continue.';
      if (!password) errors.password = 'This field is required to continue.';
    }

    if (mode === 'register') {
      if (!name.trim()) errors.name = 'This field is required to continue.';
      if (!email.trim()) errors.email = 'This field is required to continue.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
        errors.email = 'Please enter a valid email address.';
      const pwErr = validatePassword(password);
      if (!password) errors.password = 'This field is required to continue.';
      else if (pwErr) errors.password = pwErr;
    }

    if (mode === 'forgot') {
      if (!email.trim()) errors.email = 'This field is required to continue.';
    }

    if (mode === 'reset') {
      const pwErr = validatePassword(password);
      if (!password) errors.password = 'This field is required to continue.';
      else if (pwErr) errors.password = pwErr;
      if (password !== confirmPassword) errors.confirm = 'The passwords do not match.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);

    if (mode === 'login') {
      const result = await login({ email: email.trim(), password });
      if (result.ok) {
        saveSession(result.data);
        window.location.href = '/account';
        return;
      }
      setError(result.error);
    }

    if (mode === 'register') {
      const result = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      // Always show the confirmation regardless of outcome. This is deliberate —
      // revealing whether an address exists would be an information leak.
      if (result.ok || result.error.code === 'bad_request') {
        if (!result.ok && result.error.code === 'bad_request') {
          setError(result.error);
          setSubmitting(false);
          return;
        }
        setDone(true);
      } else {
        // For email_unavailable or network errors show the error
        if (result.error.code === 'email_unavailable') {
          setError(result.error);
        } else {
          setDone(true);
        }
      }
    }

    if (mode === 'forgot') {
      await forgotPassword(email.trim());
      // Always show the same neutral confirmation regardless of outcome
      setDone(true);
    }

    if (mode === 'reset') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (!token) {
        setError({ code: 'invalid_token', status: 0, message: '' });
        setSubmitting(false);
        return;
      }
      const result = await resetPassword(token, password);
      if (result.ok) {
        saveSession(result.data);
        window.location.href = '/account';
        return;
      }
      setError(result.error);
    }

    setSubmitting(false);
  };

  /* ── Verify mode renders ─────────────────────────────────────────── */
  if (mode === 'verify') {
    if (verifyState === 'loading') {
      return (
        <div class="auth" aria-live="polite">
          <div class="auth__inner">
            <div class="skeleton" style="height:24px;width:200px;margin:0 auto 16px" />
            <div class="skeleton" style="height:16px;width:280px;margin:0 auto" />
          </div>
        </div>
      );
    }
    if (verifyState === 'success') {
      return (
        <div class="auth" aria-live="polite">
          <div class="auth__inner">
            <h2 class="auth__heading">Your email is confirmed.</h2>
            <p class="auth__body">Signing you in now — one moment.</p>
          </div>
        </div>
      );
    }
    const err = error
      ? describe(error)
      : { heading: "Something didn\u2019t come through.", body: 'Please try again in a moment.' };
    return (
      <div class="auth" aria-live="polite">
        <div class="auth__inner">
          <h2 class="auth__heading">{err.heading}</h2>
          <p class="auth__body">{err.body}</p>
          <div class="auth__actions">
            <a href="/account/login" class="btn btn-primary">Sign in</a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Registration done ───────────────────────────────────────────── */
  if (mode === 'register' && done) {
    return (
      <div class="auth" aria-live="polite">
        <div class="auth__inner">
          <h2 class="auth__heading">Check your email.</h2>
          <p class="auth__body">
            A confirmation link is on its way to the address you gave. It may take a minute or
            two to arrive. The link confirms your account and signs you in — you only need to
            use it once.
          </p>
          <p class="auth__body" style="margin-top:12px;color:var(--color-ink-muted);font-size:var(--text-copy-sm)">
            This message appears whether or not the address is already registered. That is
            deliberate — it means nobody can use this form to find out whether someone has an
            account here.
          </p>
        </div>
      </div>
    );
  }

  /* ── Forgot done ─────────────────────────────────────────────────── */
  if (mode === 'forgot' && done) {
    return (
      <div class="auth" aria-live="polite">
        <div class="auth__inner">
          <h2 class="auth__heading">Check your email.</h2>
          <p class="auth__body">
            If that address belongs to an account, a reset link has been sent. It arrives within
            a few minutes and is valid for a short time.
          </p>
          <div class="auth__actions">
            <a href="/account/login" class="btn btn-ghost">Back to sign in</a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Forms ───────────────────────────────────────────────────────── */
  const heading: Record<string, string> = {
    login: 'Sign in',
    register: 'Create an account',
    forgot: 'Reset your password',
    reset: 'Choose a new password',
  };

  const subtitle: Record<string, string> = {
    login: 'Access your readings, bookings and messages.',
    register: 'Keep all your readings and booking history in one place.',
    forgot: 'Enter your email and a reset link will be sent.',
    reset: 'Enter a new password below. You will be signed in straight away.',
  };

  return (
    <div class="auth" aria-live="polite">
      <div class="auth__inner">
        <h2 class="auth__heading">{heading[mode]}</h2>
        <p class="auth__body">{subtitle[mode]}</p>

        {error && (
          <div class="notice notice-danger auth__notice" role="alert">
            <div>
              <strong>{describe(error).heading}</strong>
              <p>{describe(error).body}</p>
            </div>
          </div>
        )}

        <form class="form auth__form" noValidate onSubmit={(e) => void handleSubmit(e)}>
          {mode === 'register' && (
            <Field
              id="name"
              label="Your name"
              value={name}
              onInput={setName}
              error={fieldErrors.name}
              autocomplete="name"
            />
          )}

          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <Field
              id="email"
              label="Email address"
              type="email"
              value={email}
              onInput={setEmail}
              error={fieldErrors.email}
              autocomplete="email"
            />
          )}

          {mode === 'register' && (
            <Field
              id="phone"
              label="Telephone"
              type="tel"
              value={phone}
              onInput={setPhone}
              optional
              autocomplete="tel"
            />
          )}

          {(mode === 'login' || mode === 'register' || mode === 'reset') && (
            <Field
              id="password"
              label={mode === 'reset' ? 'New password' : 'Password'}
              type="password"
              value={password}
              onInput={setPassword}
              error={fieldErrors.password}
              autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
              help={mode !== 'login' ? 'Between 8 and 200 characters.' : undefined}
            />
          )}

          {mode === 'reset' && (
            <Field
              id="confirm"
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onInput={setConfirmPassword}
              error={fieldErrors.confirm}
              autocomplete="new-password"
            />
          )}

          <button type="submit" class="btn btn-primary btn-block" disabled={submitting}>
            {submitting
              ? 'One moment\u2026'
              : mode === 'login'
                ? 'Sign in'
                : mode === 'register'
                  ? 'Create account'
                  : mode === 'forgot'
                    ? 'Send reset link'
                    : 'Set password'}
          </button>
        </form>

        <div class="auth__links">
          {mode === 'login' && (
            <>
              <a href="/account/forgot-password" class="link">Forgotten your password?</a>
              <a href="/account/register" class="link">Create an account</a>
            </>
          )}
          {mode === 'register' && (
            <a href="/account/login" class="link">Already have an account? Sign in</a>
          )}
          {mode === 'forgot' && (
            <a href="/account/login" class="link">Back to sign in</a>
          )}
          {mode === 'reset' && (
            <a href="/account/login" class="link">Back to sign in</a>
          )}
        </div>
      </div>
    </div>
  );
}
