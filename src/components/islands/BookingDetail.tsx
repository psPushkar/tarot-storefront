import { useEffect, useState } from 'preact/hooks';

import {
  getMyBooking,
  getMessages,
  postMessage,
  isAuthFailure,
} from '../../lib/api';
import type { ApiFailure } from '../../lib/result';
import {
  clearSession,
  getCustomerToken,
} from '../../lib/session';
import type { Booking, Message } from '../../lib/types';
import {
  formatDateTime,
  formatDuration,
  formatMoney,
  formatRelative,
  statusLabel,
  statusTone,
} from '../../lib/format';

/* ═══════════════════════════════════════════════════════════════════════
   Copy table
   ═══════════════════════════════════════════════════════════════════════ */

function describe(error: ApiFailure): { heading: string; body: string } {
  switch (error.code) {
    case 'not_found':
      return {
        heading: 'That booking could not be found.',
        body: 'The reference may be mistyped, or the link may have expired.',
      };
    case 'messaging_unavailable':
      return {
        heading: "Messages aren\u2019t available for this practice.",
        body: 'You can still reach me through the contact page.',
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
   Component
   ═══════════════════════════════════════════════════════════════════════ */

export default function BookingDetail() {
  const [token, setToken] = useState<string | undefined>(undefined);
  const [checked, setChecked] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiFailure | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  /* ── Messaging ────────────────────────────────────────────────────── */
  const [messageBody, setMessageBody] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [messageError, setMessageError] = useState<ApiFailure | null>(null);

  const MAX_MESSAGE = 4000;

  /* ── Init ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    setBookingId(id);

    const t = getCustomerToken();
    setToken(t);
    setChecked(true);

    if (!id || !t) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const [bookingResult, messagesResult] = await Promise.all([
        getMyBooking(t, id),
        getMessages(t, id),
      ]);

      if (cancelled) return;

      if (!bookingResult.ok && isAuthFailure(bookingResult.error)) {
        clearSession();
        setSessionEnded(true);
        setLoading(false);
        return;
      }

      if (!bookingResult.ok) {
        setError(bookingResult.error);
        setLoading(false);
        return;
      }

      setBooking(bookingResult.data);
      if (messagesResult.ok) setMessages(messagesResult.data);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Send message ─────────────────────────────────────────────────── */
  const handleSendMessage = async (event: Event) => {
    event.preventDefault();
    if (!token || !bookingId || messageSending || !messageBody.trim()) return;

    setMessageSending(true);
    setMessageError(null);

    const result = await postMessage(token, bookingId, messageBody.trim());
    if (result.ok) {
      setMessageBody('');
      // Re-fetch messages
      const refreshed = await getMessages(token, bookingId);
      if (refreshed.ok) setMessages(refreshed.data);
    } else {
      setMessageError(result.error);
    }
    setMessageSending(false);
  };

  /* ── Badge helper ─────────────────────────────────────────────────── */
  function badgeClass(status: string): string {
    const tone = statusTone(status);
    if (tone === 'success') return 'badge badge-success';
    if (tone === 'warning') return 'badge badge-warning';
    if (tone === 'danger') return 'badge badge-danger';
    return 'badge';
  }

  /* ── Guards ───────────────────────────────────────────────────────── */
  if (checked && !bookingId) {
    return (
      <div class="bdetail" aria-live="polite">
        <div class="bdetail__empty">
          <h2 class="bdetail__empty-heading">No booking specified.</h2>
          <p class="bdetail__empty-body">
            This page shows the details of a single booking. Visit your account to see all
            your bookings, or check the link you followed.
          </p>
          <a href="/account" class="btn btn-primary">Your account</a>
        </div>
      </div>
    );
  }

  if (checked && !token && !sessionEnded) {
    return (
      <div class="bdetail" aria-live="polite">
        <div class="bdetail__empty">
          <h2 class="bdetail__empty-heading">You are not signed in.</h2>
          <p class="bdetail__empty-body">
            Sign in to view your booking and messages.
          </p>
          <a href="/account/login" class="btn btn-primary">Sign in</a>
        </div>
      </div>
    );
  }

  if (sessionEnded) {
    return (
      <div class="bdetail" aria-live="polite">
        <div class="bdetail__empty">
          <h2 class="bdetail__empty-heading">Your session has ended.</h2>
          <p class="bdetail__empty-body">Please sign in again to continue.</p>
          <a href="/account/login" class="btn btn-primary">Sign in</a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div class="bdetail" aria-busy="true" aria-label="Loading booking">
        <div class="skeleton" style="height:28px;width:200px;margin-bottom:16px" />
        <div class="skeleton" style="height:16px;width:300px;margin-bottom:24px" />
        <div class="skeleton" style="height:200px;border-radius:var(--radius-lg)" />
      </div>
    );
  }

  if (error) {
    const err = describe(error);
    return (
      <div class="bdetail" aria-live="polite">
        <div class="bdetail__empty">
          <h2 class="bdetail__empty-heading">{err.heading}</h2>
          <p class="bdetail__empty-body">{err.body}</p>
          <a href="/account" class="btn btn-primary">Your account</a>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const reading = booking.reading;
  const showJoin = booking.status === 'confirmed' && !!booking.meeting_link;

  return (
    <div class="bdetail" aria-live="polite">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div class="bdetail__header">
        <span class={badgeClass(booking.status)}>{statusLabel(booking.status)}</span>
        <h2 class="bdetail__title">{booking.service_name}</h2>
      </div>

      {/* ── Details card ────────────────────────────────────────────── */}
      <div class="panel bdetail__facts">
        <dl class="breakdown">
          <div class="breakdown-row">
            <dt>Date and time</dt>
            <dd>{formatDateTime(booking.start_at)}</dd>
          </div>
          <div class="breakdown-row">
            <dt>Duration</dt>
            <dd>{formatDuration(
              Math.round((new Date(booking.end_at).getTime() - new Date(booking.start_at).getTime()) / 60000)
            )}</dd>
          </div>
          <div class="breakdown-row">
            <dt>Price</dt>
            <dd>{formatMoney(booking.price_cents, 'GBP')}</dd>
          </div>
          {booking.addons && booking.addons.length > 0 && (
            <div class="breakdown-row">
              <dt>Add-ons</dt>
              <dd>{booking.addons.map((a) => a.title).join(', ')}</dd>
            </div>
          )}
          {booking.question && (
            <div class="breakdown-row">
              <dt>Your question</dt>
              <dd style="white-space:normal;text-align:start">{booking.question}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* ── Join button ─────────────────────────────────────────────── */}
      {showJoin && (
        <a href={booking.meeting_link} class="btn btn-primary btn-lg bdetail__join" target="_blank" rel="noopener noreferrer">
          Join the session
        </a>
      )}

      {/* ── Manage link ─────────────────────────────────────────────── */}
      <p class="bdetail__manage-link">
        Need to move or cancel?{' '}
        <a href={`/booking/manage?id=${booking.id}`} class="link">Manage this booking</a>
      </p>

      {/* ── Reading ─────────────────────────────────────────────────── */}
      {reading && reading.content && (
        <section class="bdetail__reading panel">
          <h3 class="bdetail__section-heading">Your reading</h3>
          {reading.cards_drawn && (
            <div class="bdetail__cards">
              {reading.cards_drawn.split(',').map((card) => (
                <span key={card.trim()} class="bdetail__card-pill">{card.trim()}</span>
              ))}
            </div>
          )}
          <div class="prose">
            {reading.content.split(/\n\s*\n/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          {reading.recording_url && (
            <div class="bdetail__recording">
              <h4 class="bdetail__recording-label">Recording</h4>
              <audio controls preload="none" src={reading.recording_url} style="width:100%;margin-top:8px" />
              <p class="help" style="margin-top:8px">
                This link is valid for a few hours. If it stops working, reload the page to get
                a fresh one.
              </p>
            </div>
          )}
        </section>
      )}

      {/* ── Messages ────────────────────────────────────────────────── */}
      <section class="bdetail__messages panel">
        <h3 class="bdetail__section-heading">Messages</h3>

        {messages.length === 0 ? (
          <p class="bdetail__msg-empty">No messages yet.</p>
        ) : (
          <div class="bdetail__msg-list">
            {messages.map((msg, i) => (
              <div key={i} class={`bdetail__msg ${msg.sender === 'reader' ? 'bdetail__msg--reader' : 'bdetail__msg--client'}`}>
                <p class="bdetail__msg-body">{msg.body}</p>
                <span class="bdetail__msg-time">{formatRelative(msg.created_at)}</span>
              </div>
            ))}
          </div>
        )}

        {messageError && (
          <div class="notice notice-danger" role="alert" style="margin-top:16px">
            <div>
              <strong>{describe(messageError).heading}</strong>
              <p>{describe(messageError).body}</p>
            </div>
          </div>
        )}

        <form class="bdetail__composer" noValidate onSubmit={(e) => void handleSendMessage(e)}>
          <label for="msg-body" class="label">Write a message</label>
          <textarea
            id="msg-body"
            class="textarea"
            rows={3}
            maxLength={MAX_MESSAGE}
            value={messageBody}
            onInput={(e) => setMessageBody((e.target as HTMLTextAreaElement).value)}
            aria-describedby="msg-count"
          />
          <div class="bdetail__composer-footer">
            <span id="msg-count" class="help">
              {MAX_MESSAGE - messageBody.length} characters remaining
            </span>
            <button type="submit" class="btn btn-primary btn-sm" disabled={messageSending || !messageBody.trim()}>
              {messageSending ? 'Sending\u2026' : 'Send'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
