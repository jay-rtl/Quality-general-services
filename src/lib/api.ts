/**
 * PHP intake API client. Same-origin /api/* is the default; mock mode must be
 * explicitly requested and never claims that a message was sent.
 */
import { isPreview } from '@/config/build';

export type FormKind = 'quote' | 'contact' | 'application';

export const ENDPOINTS: Record<FormKind, string> = {
  quote: '/api/quote',
  contact: '/api/contact',
  application: '/api/applications',
};

export interface SubmitResult {
  ok: boolean;
  message: string;
  reference?: string;
  fieldErrors?: Record<string, string>;
}

const API_BASE = (import.meta.env.PUBLIC_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const USE_MOCK = isPreview || import.meta.env.PUBLIC_API_MOCK === 'true';

export async function submitForm(kind: FormKind, body: FormData): Promise<SubmitResult> {
  if (USE_MOCK) return mockSubmit();

  try {
    const res = await fetch(`${API_BASE}${ENDPOINTS[kind]}`, {
      method: 'POST',
      body, // multipart/form-data — browser sets the boundary header
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      signal: AbortSignal.timeout(90000),
    });
    const data = (await res.json().catch(() => ({}))) as Partial<SubmitResult>;
    if (!res.ok || data.ok !== true) {
      return {
        ok: false,
        message: typeof data.message === 'string' ? data.message : 'Something went wrong. Please try again or contact us directly.',
        fieldErrors: data.fieldErrors && typeof data.fieldErrors === 'object'
          ? Object.fromEntries(Object.entries(data.fieldErrors).filter(([key, value]) => /^[a-z_]+$/.test(key) && typeof value === 'string'))
          : undefined,
      };
    }
    return { ok: true, message: typeof data.message === 'string' ? data.message : 'Thank you, your submission has been received.', reference: typeof data.reference === 'string' ? data.reference : undefined };
  } catch {
    return { ok: false, message: 'We could not reach the server. Please check your connection and try again.' };
  }
}

async function mockSubmit(): Promise<SubmitResult> {
  await new Promise((r) => setTimeout(r, 1100));
  return {
    ok: true,
    message: 'Demo complete. No email was sent, no documents were uploaded, and no submission was stored.',
  };
}
