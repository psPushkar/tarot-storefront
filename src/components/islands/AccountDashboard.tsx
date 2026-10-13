import { useEffect, useState } from 'preact/hooks';

import {
  changePassword,
  getMe,
  getMyBookings,
  getMyReadings,
  logout,
  updateMe,
  isAuthFailure,
} from '../../lib/api';
import type { ApiFailure } from '../../lib/result';
import {
  clearSession,
  getCustomerToken,
} from '../../lib/session';
import type { Booking, Customer, MeReading } from '../../lib/types';
import {
  formatDateShort,
  formatMoney,
  formatRelative,
  statusLabel,
  statusTone,
  truncate,
} from '../../lib/format';

/* ═══════════════════════════════════════════════════════════════════════
   Copy table
   ═══════════════════════════════════════════════════════════════════════ */

function describe(error: ApiFailure): { heading: string; body: string } {
  switch (error.code) {
    case 'network_error':
    case 'timeout':
    case 'server_error':
    case 'not_configured':
      return {
        heading: "Something didn\u2019t come through.",
        body: "This couldn\u2019t be completed at the moment. Please try again in a moment.",
      };
    case 'bad_request':
      return {
        heading: 'Something in the form needs attention.',
        body: 'Please check the details you entered and try once more.',
      };
    case 'invalid_credentials':
      return {
        heading: "That didn\u2019t work.",
        body: 'The current password was not recognised. Please try again.',
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
      {help && <p class="help" id={`${id}-help`}>{help}</p>}
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
   Tabs
   ═══════════════════════════════════════════════════════════════════════ */

type Tab = 'upcoming' | 'past' | 'readings' | 'profile';

const TABS: { id: Tab; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'readings', label: 'Readings' },
  { id: 'profile', label: 'Profile' },
];

/* ═══════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════ */

export default function AccountDashboard() {
  const [token, setToken] = useState<string | undefined>(undefined);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [readings, setReadings] = useState<MeReading[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>('upcoming');

  /* ── Profile editing ──────────────────────────────────────────────── */
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileBirthDate, setProfileBirthDate] = useState('');
  const [profileBirthTime, setProfileBirthTime] = useState('');
  const [profileBirthPlace, setProfileBirthPlace] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<ApiFailure | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  /* ── Password change ──────────────────────────────────────────────── */
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<ApiFailure | null>(null);
  const [pwFieldErrors, setPwFieldErrors] = useState<Record<string, string>>({});
  const [pwDone, setPwDone] = useState(false);

  /* ── Load data ────────────────────────────────────────────────────── */
  useEffect(() => {
    const t = getCustomerToken();
    setToken(t);
    setChecked(true);

    if (!t) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const [meResult, bookingsResult, readingsResult] = await Promise.all([
        getMe(t),
        getMyBookings(t),
        getMyReadings(t),
      ]);

      if (cancelled) return;

      if (!meResult.ok && isAuthFailure(meResult.error)) {
        clearSession();
        setSessionEnded(true);
        setLoading(false);
        return;
      }
      if (!bookingsResult.ok && isAuthFailure(bookingsResult.error)) {
        clearSession();
        setSessionEnded(true);
        setLoading(false);
        return;
      }
      if (!readingsResult.ok && isAuthFailure(readingsResult.error)) {
        clearSession();
        setSessionEnded(true);
        setLoading(false);
        return;
      }

      if (meResult.ok) {
        setCustomer(meResult.data);
        setProfileName(meResult.data.name);
        setProfilePhone(meResult.data.phone ?? '');
        setProfileBirthDate(meResult.data.birth_date ?? '');
        setProfileBirthTime(meResult.data.birth_time ?? '');
        setProfileBirthPlace(meResult.data.birth_place ?? '');
      }
      if (bookingsResult.ok) setBookings(bookingsResult.data);
      if (readingsResult.ok) setReadings(readingsResult.data);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Sign out ─────────────────────────────────────────────────────── */
  const handleSignOut = async () => {
    if (token) await logout(token);
    clearSession();
    window.location.href = '/account/login';
  };

  /* ── Profile save ─────────────────────────────────────────────────── */
  const handleProfileSave = async (event: Event) => {
    event.preventDefault();
    if (!token || profileSaving) return;
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);

    const result = await updateMe(token, {
      name: profileName.trim(),
      phone: profilePhone.trim() || undefined,
      birth_date: profileBirthDate || undefined,
      birth_time: profileBirthTime || undefined,
      birth_place: profileBirthPlace.trim() || undefined,
    });

    if (result.ok) {
      setCustomer(result.data);
      setProfileSuccess(true);
    } else {
      setProfileError(result.error);
    }
    setProfileSaving(false);
  };

  /* ── Password change ──────────────────────────────────────────────── */
  const handlePasswordChange = async (event: Event) => {
    event.preventDefault();
    if (!token || pwSaving) return;

    const errors: Record<string, string> = {};
    if (!currentPw) errors.currentPw = 'This field is required to continue.';
    if (!newPw) errors.newPw = 'This field is required to continue.';
    else if (newPw.length < 8) errors.newPw = 'At least 8 characters are needed.';
    else if (newPw.length > 200) errors.newPw = 'That is too long \u2014 200 characters at most.';
    setPwFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setPwSaving(true);
    setPwError(null);

    const result = await changePassword(token, currentPw, newPw);
    if (result.ok) {
      clearSession();
      setPwDone(true);
    } else {
      setPwError(result.error);
    }
    setPwSaving(false);
  };

  /* ── Split bookings ──────────────────────────────────────────────── */
  const now = Date.now();
  const upcoming = bookings.filter(
    (b) =>
      new Date(b.start_at).getTime() > now &&
      b.status !== 'cancelled' &&
      b.status !== 'expired',
  );
  const past = bookings.filter(
    (b) =>
      new Date(b.start_at).getTime() <= now ||
      b.status === 'cancelled' ||
      b.status === 'expired',
  );

  /* ── Badge class helper ──────────────────────────────────────────── */
  function badgeClass(status: string): string {
    const tone = statusTone(status);
    if (tone === 'success') return 'badge badge-success';
    if (tone === 'warning') return 'badge badge-warning';
    if (tone === 'danger') return 'badge badge-danger';
    return 'badge';
  }

  /* ── Not signed in ───────────────────────────────────────────────── */
  if (checked && !token && !sessionEnded) {
    return (
      <div class="dash" aria-live="polite">
        <div class="dash__empty">
          <h2 class="dash__empty-heading">You are not signed in.</h2>
          <p class="dash__empty-body">
            Sign in to see your bookings, readings and messages in one place.
          </p>
          <div class="dash__empty-actions">
            <a href="/account/login" class="btn btn-primary">Sign in</a>
            <a href="/account/register" class="btn btn-ghost">Create an account</a>
          </div>
        </div>
      </div>
    );
  }

  if (sessionEnded) {
    return (
      <div class="dash" aria-live="polite">
        <div class="dash__empty">
          <h2 class="dash__empty-heading">Your session has ended.</h2>
          <p class="dash__empty-body">
            Please sign in again to continue. Sessions expire after a period of inactivity.
          </p>
          <div class="dash__empty-actions">
            <a href="/account/login" class="btn btn-primary">Sign in</a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Loading ─────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div class="dash" aria-busy="true" aria-label="Loading your account">
        <div class="skeleton" style="height:28px;width:220px;margin-bottom:32px" />
        <div class="dash__tabs-skeleton">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} class="skeleton" style="height:20px;width:80px" />
          ))}
        </div>
        <div class="dash__grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} class="skeleton" style="height:120px;border-radius:var(--radius-lg)" />
          ))}
        </div>
      </div>
    );
  }

  /* ── Password change done ────────────────────────────────────────── */
  if (pwDone) {
    return (
      <div class="dash" aria-live="polite">
        <div class="dash__empty">
          <h2 class="dash__empty-heading">Password changed.</h2>
          <p class="dash__empty-body">
            Every session has been signed out for your security. You will need to sign in
            again with your new password — this is the expected behaviour whenever a
            password changes.
          </p>
          <div class="dash__empty-actions">
            <a href="/account/login" class="btn btn-primary">Sign in</a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main dashboard ──────────────────────────────────────────────── */
  return (
    <div class="dash" aria-live="polite">
      <p class="dash__greeting">
        Welcome back, {customer?.name?.split(' ')[0] ?? 'there'}.
      </p>

      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <div class="dash__tabs" role="tablist" aria-label="Account sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            class={`dash__tab ${activeTab === tab.id ? 'dash__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Upcoming ─────────────────────────────────────────────────── */}
      {activeTab === 'upcoming' && (
        <div role="tabpanel" aria-label="Upcoming bookings">
          {upcoming.length === 0 ? (
            <div class="dash__empty-tab">
              <h3 class="dash__empty-heading">Nothing in the diary.</h3>
              <p class="dash__empty-body">
                When you book a reading it will appear here, with everything you need for the
                session.
              </p>
              <a href="/services" class="link-onward">Browse readings</a>
            </div>
          ) : (
            <div class="dash__grid">
              {upcoming.map((b) => (
                <a key={b.id} href={`/account/booking?id=${b.id}`} class="dash__booking card card-interactive">
                  <div class="dash__booking-top">
                    <span class="dash__booking-service">{b.service_name}</span>
                    <span class={badgeClass(b.status)}>{statusLabel(b.status)}</span>
                  </div>
                  <span class="dash__booking-date">{formatDateShort(b.start_at)}</span>
                  <span class="dash__booking-price">{formatMoney(b.price_cents, 'GBP')}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Past ─────────────────────────────────────────────────────── */}
      {activeTab === 'past' && (
        <div role="tabpanel" aria-label="Past bookings">
          {past.length === 0 ? (
            <div class="dash__empty-tab">
              <h3 class="dash__empty-heading">No past bookings.</h3>
              <p class="dash__empty-body">Completed and cancelled bookings appear here.</p>
            </div>
          ) : (
            <div class="dash__grid">
              {past.map((b) => (
                <a key={b.id} href={`/account/booking?id=${b.id}`} class="dash__booking card card-interactive">
                  <div class="dash__booking-top">
                    <span class="dash__booking-service">{b.service_name}</span>
                    <span class={badgeClass(b.status)}>{statusLabel(b.status)}</span>
                  </div>
                  <span class="dash__booking-date">{formatDateShort(b.start_at)}</span>
                  <span class="dash__booking-price">{formatMoney(b.price_cents, 'GBP')}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Readings ─────────────────────────────────────────────────── */}
      {activeTab === 'readings' && (
        <div role="tabpanel" aria-label="Delivered readings">
          {readings.length === 0 ? (
            <div class="dash__empty-tab">
              <h3 class="dash__empty-heading">No readings delivered yet.</h3>
              <p class="dash__empty-body">
                A reading appears here once it has been written up. You keep permanent access
                to everything delivered.
              </p>
            </div>
          ) : (
            <div class="dash__grid">
              {readings.map((r) => (
                <a
                  key={r.booking_id}
                  href={`/account/booking?id=${r.booking_id}`}
                  class="dash__reading card card-interactive"
                >
                  {r.cards_drawn && (
                    <div class="dash__cards">
                      {r.cards_drawn.split(',').map((card) => (
                        <span key={card.trim()} class="dash__card-pill">{card.trim()}</span>
                      ))}
                    </div>
                  )}
                  {r.content && (
                    <p class="dash__reading-excerpt">{truncate(r.content, 140)}</p>
                  )}
                  <span class="dash__reading-date">{formatRelative(r.delivered_at)}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Profile ──────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div role="tabpanel" aria-label="Profile settings">
          <div class="dash__profile-sections">
            {/* Details */}
            <div class="panel">
              <h3 class="dash__section-heading">Your details</h3>

              {profileSuccess && (
                <div class="notice notice-success" role="status" style="margin-bottom:16px">
                  <div>Your details have been updated.</div>
                </div>
              )}
              {profileError && (
                <div class="notice notice-danger" role="alert" style="margin-bottom:16px">
                  <div>
                    <strong>{describe(profileError).heading}</strong>
                    <p>{describe(profileError).body}</p>
                  </div>
                </div>
              )}

              <form class="form" noValidate onSubmit={(e) => void handleProfileSave(e)}>
                <Field id="profile-name" label="Name" value={profileName} onInput={setProfileName} autocomplete="name" />
                <Field id="profile-phone" label="Telephone" type="tel" value={profilePhone} onInput={setProfilePhone} optional autocomplete="tel" />
                <Field id="profile-birth-date" label="Date of birth" type="date" value={profileBirthDate} onInput={setProfileBirthDate} optional />
                <Field id="profile-birth-time" label="Time of birth" type="time" value={profileBirthTime} onInput={setProfileBirthTime} optional />
                <Field id="profile-birth-place" label="Place of birth" value={profileBirthPlace} onInput={setProfileBirthPlace} optional />
                <button type="submit" class="btn btn-primary btn-sm" disabled={profileSaving}>
                  {profileSaving ? 'Saving\u2026' : 'Save details'}
                </button>
              </form>
            </div>

            {/* Password */}
            <div class="panel">
              <h3 class="dash__section-heading">Change password</h3>

              {pwError && (
                <div class="notice notice-danger" role="alert" style="margin-bottom:16px">
                  <div>
                    <strong>{describe(pwError).heading}</strong>
                    <p>{describe(pwError).body}</p>
                  </div>
                </div>
              )}

              <form class="form" noValidate onSubmit={(e) => void handlePasswordChange(e)}>
                <Field id="current-pw" label="Current password" type="password" value={currentPw} onInput={setCurrentPw} error={pwFieldErrors.currentPw} autocomplete="current-password" />
                <Field id="new-pw" label="New password" type="password" value={newPw} onInput={setNewPw} error={pwFieldErrors.newPw} autocomplete="new-password" help="Between 8 and 200 characters." />
                <button type="submit" class="btn btn-ghost btn-sm" disabled={pwSaving}>
                  {pwSaving ? 'Changing\u2026' : 'Change password'}
                </button>
              </form>
            </div>

            {/* Sign out */}
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              onClick={() => void handleSignOut()}
              style="align-self:start"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
