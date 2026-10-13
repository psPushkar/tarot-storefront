import { useState } from 'preact/hooks';
import { postContact } from '../../lib/api';

interface FormState {
  status: 'idle' | 'submitting' | 'success' | 'error';
  errorHeading?: string;
  errorBody?: string;
  retryable?: boolean;
}

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<FormState>({ status: 'idle' });

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = 'This field is required to continue.';
    if (!email.trim()) next.email = 'This field is required to continue.';
    else if (!validateEmail(email.trim())) next.email = 'Please enter a valid email address.';
    if (!message.trim()) next.message = 'This field is required to continue.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!validate()) return;

    setState({ status: 'submitting' });

    const result = await postContact({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      website,
    });

    if (result.ok) {
      setState({ status: 'success' });
      return;
    }

    const code = result.error.code;

    if (code === 'email_unavailable') {
      setState({
        status: 'error',
        errorHeading: "Messages aren't being delivered just yet.",
        errorBody: "The contact form isn't connected. In the meantime you can reach me through the links beside this form.",
        retryable: false,
      });
    } else if (code === 'rate_limited') {
      let body = 'To protect everyone\u2019s experience, wait a few minutes before sending again.';
      if (result.error.retryAfter) {
        body += ` You can try again in about ${result.error.retryAfter} seconds.`;
      }
      setState({
        status: 'error',
        errorHeading: 'Please slow down.',
        errorBody: body,
        retryable: false,
      });
    } else if (
      code === 'network_error' ||
      code === 'timeout' ||
      code === 'server_error' ||
      code === 'not_configured'
    ) {
      setState({
        status: 'error',
        errorHeading: "Something didn't come through.",
        errorBody: 'Your message couldn\u2019t be sent just now. This is most likely a brief interruption \u2014 please try again in a moment.',
        retryable: true,
      });
    } else {
      setState({
        status: 'error',
        errorHeading: "Something didn't come through.",
        errorBody: 'Your message couldn\u2019t be sent just now. This is most likely a brief interruption \u2014 please try again in a moment.',
        retryable: true,
      });
    }
  }

  if (state.status === 'success') {
    return (
      <div role="status" aria-live="polite" class="contact-success">
        <h2 class="contact-success__heading">Your message is on its way.</h2>
        <p class="contact-success__body">
          I read everything myself and reply within two working days. If it's urgent, say so in the subject and I'll move it up.
        </p>
      </div>
    );
  }

  if (state.status === 'error' && !state.retryable) {
    return (
      <div role="status" aria-live="polite" class="notice notice-warning">
        <div>
          <p style="font-weight:600;margin-bottom:6px">{state.errorHeading}</p>
          <p>{state.errorBody}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {state.status === 'error' && state.retryable && (
        <div role="status" aria-live="polite" class="notice notice-danger" style="margin-bottom:24px">
          <div>
            <p style="font-weight:600;margin-bottom:6px">{state.errorHeading}</p>
            <p>{state.errorBody}</p>
          </div>
        </div>
      )}

      <div style="display:flex;flex-direction:column;gap:20px">
        <div class="field">
          <label class="label" for="contact-name">Name</label>
          <input
            id="contact-name"
            class="input"
            type="text"
            value={name}
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
            aria-invalid={errors.name ? 'true' : undefined}
            aria-describedby={errors.name ? 'contact-name-err' : undefined}
            autocomplete="name"
          />
          {errors.name && <p id="contact-name-err" class="error-text">{errors.name}</p>}
        </div>

        <div class="field">
          <label class="label" for="contact-email">Email</label>
          <input
            id="contact-email"
            class="input"
            type="email"
            value={email}
            onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
            aria-invalid={errors.email ? 'true' : undefined}
            aria-describedby={errors.email ? 'contact-email-err' : undefined}
            autocomplete="email"
          />
          {errors.email && <p id="contact-email-err" class="error-text">{errors.email}</p>}
        </div>

        <div class="field">
          <label class="label" for="contact-message">Message</label>
          <textarea
            id="contact-message"
            class="textarea"
            value={message}
            onInput={(e) => setMessage((e.target as HTMLTextAreaElement).value)}
            aria-invalid={errors.message ? 'true' : undefined}
            aria-describedby={errors.message ? 'contact-message-err' : undefined}
          />
          {errors.message && <p id="contact-message-err" class="error-text">{errors.message}</p>}
        </div>

        <div class="honeypot">
          <label for="contact-website">Website</label>
          <input
            id="contact-website"
            name="website"
            type="text"
            value={website}
            onInput={(e) => setWebsite((e.target as HTMLInputElement).value)}
            tabIndex={-1}
            autocomplete="off"
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          disabled={state.status === 'submitting'}
        >
          {state.status === 'submitting' ? 'Sending\u2026' : 'Send message'}
        </button>

        {state.status === 'error' && state.retryable && (
          <button type="submit" class="btn btn-ghost">
            Try again
          </button>
        )}
      </div>
    </form>
  );
}
